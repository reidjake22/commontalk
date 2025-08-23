# modules/cluster/store.py
import os
import tempfile
from typing import Dict, Tuple, List, Optional

import numpy as np
from psycopg2 import sql
from modules.points.embed import embed

TMP_DIR = tempfile.gettempdir()


# =========================
# Paths & small utilities
# =========================

def paths_for_job(job_id: int) -> Tuple[str, str]:
    """No dims in filenames; simpler and decoupled."""
    ids_path = os.path.join(TMP_DIR, f"ids_{job_id}.dat")
    fp16_path = os.path.join(TMP_DIR, f"Xfp16_{job_id}.dat")
    return ids_path, fp16_path


def _empty_store(job_id: int) -> Tuple[str, str, int, int]:
    """Create empty store files and return shapes as zeros (raw empty .dat files)."""
    ids_path, fp16_path = paths_for_job(job_id)
    open(ids_path, "wb").close()
    open(fp16_path, "wb").close()
    return ids_path, fp16_path, 0, 0


def cleanup_store(job_id: int) -> None:
    """Delete temp store files for a given job id."""
    ids_path, fp16_path = paths_for_job(job_id)
    for p in (ids_path, fp16_path):
        try:
            os.remove(p)
        except OSError:
            pass


# =========================
# SQL helpers
# =========================

def _where_for_filters(filters: Dict) -> Tuple[Optional[sql.SQL], List]:
    """
    Build a WHERE tail (without leading AND) and positional params.
    Returns (None, []) if there are no extra filters.
    """
    clauses: List[sql.SQL] = []
    params: List = []

    if filters.get("house"):
        clauses.append(sql.SQL("d.house = %s"))
        params.append(filters["house"])
    if filters.get("start_date"):
        clauses.append(sql.SQL("d.date >= %s"))
        params.append(filters["start_date"])
    if filters.get("end_date"):
        clauses.append(sql.SQL("d.date <= %s"))
        params.append(filters["end_date"])
    if filters.get("member_ids"):
        clauses.append(sql.SQL("c.member_id = ANY(%s)"))
        params.append(filters["member_ids"])

    if clauses:
        return sql.SQL(" AND ").join(clauses), params
    return None, params


def count_points(conn, filters: Dict) -> int:
    """
    Count rows that have fp16 bytes present (emb256_f16) and a member_id,
    with optional filters applied.
    """
    base = sql.SQL("""
      SELECT COUNT(*)
      FROM point p
      JOIN contribution c ON p.contribution_item_id = c.item_id
      JOIN debate d       ON c.debate_ext_id = d.ext_id
      WHERE p.emb256_f16 IS NOT NULL
        AND c.member_id IS NOT NULL
    """)
    where_sql, params = _where_for_filters(filters)
    q = base if where_sql is None else base + sql.SQL(" AND ") + where_sql
    with conn.cursor() as cur:
        cur.execute(q, params)
        return cur.fetchone()[0] or 0


# =========================
# Builders (streaming)
# =========================

def build_local_fp16_store(
    conn,
    filters: Dict,
    job_id: int,
) -> Tuple[str, str, int, int]:
    """
    Stream all matching rows, writing:
      ids_.dat   : int64 shape (N,)
      Xfp16_.dat : float16 memmap shape (N, inferred_dims)

    Uses p.emb256_f16 (fp16 bytea) only. No dims argument, no client truncation.
    Pre-sizes exactly via COUNT, then streams via server-side cursor.
    """
    # Infer dims from a sample row (fp16 -> 2 bytes per dim)
    with conn.cursor() as cur0:
        cur0.execute("""
            SELECT octet_length(p.emb256_f16)
            FROM point p
            JOIN contribution c ON p.contribution_item_id = c.item_id
            JOIN debate d       ON c.debate_ext_id = d.ext_id
            WHERE p.emb256_f16 IS NOT NULL
              AND c.member_id IS NOT NULL
            LIMIT 1
        """)
        row = cur0.fetchone()
    if not row or not row[0]:
        return _empty_store(job_id)
    dims = row[0] // 2

    # Size memmaps exactly
    N = count_points(conn, filters)
    if N == 0:
        return _empty_store(job_id)

    ids_path, fp16_path = paths_for_job(job_id)
    ids_mm = np.memmap(ids_path, dtype=np.int64, mode="w+", shape=(N,))
    Xf16_mm = np.memmap(fp16_path, dtype=np.float16, mode="w+", shape=(N, dims))

    BATCH = 100
    with conn.cursor(name="points_stream") as cur:
        where_sql, params = _where_for_filters(filters)
        base = sql.SQL("""
            SELECT p.point_id, p.emb256_f16
            FROM point p
            JOIN contribution c ON p.contribution_item_id = c.item_id
            JOIN debate d       ON c.debate_ext_id = d.ext_id
            WHERE p.emb256_f16 IS NOT NULL
              AND c.member_id IS NOT NULL
        """)
        q = base if where_sql is None else base + sql.SQL(" AND ") + where_sql

        cur.itersize = BATCH
        cur.execute(q, params)

        i = 0
        for rows in iter(lambda: cur.fetchmany(BATCH), []):
            if not rows:
                break
            m = len(rows)
            ids_mm[i:i + m] = [r[0] for r in rows]
            for j in range(m):
                Xf16_mm[i + j] = np.frombuffer(rows[j][1], dtype=np.float16, count=dims)
            i += m

    ids_mm.flush(); Xf16_mm.flush()
    return ids_path, fp16_path, N, dims


def build_local_fp16_store_search(
    conn,
    filters: Dict,
    job_id: int,
    *,
    search_limit: int,
) -> Tuple[str, str, int, int]:
    """
    Rank by full pgvector (p.point_embedding <-> q), limit to `search_limit`,
    write truncated fp16 bytes from p.emb256_f16.

    Streaming plan:
      - Use a server-side cursor with ORDER BY ... LIMIT K
      - Fetch the first row to infer dims
      - Pre-allocate memmaps for K rows (upper bound)
      - Stream-insert batches
      - Truncate files to K_eff at the end
    """
    query_text = (filters or {}).get("query")
    if not query_text or search_limit <= 0:
        return _empty_store(job_id)

    qvec = list(map(float, embed(query_text)))

    where_sql, params = _where_for_filters(filters)
    base = sql.SQL("""
        SELECT p.point_id, p.emb256_f16
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN debate d       ON c.debate_ext_id = d.ext_id
        WHERE p.point_embedding IS NOT NULL
          AND p.emb256_f16 IS NOT NULL
          AND c.member_id IS NOT NULL
    """)
    q = base if where_sql is None else base + sql.SQL(" AND ") + where_sql
    q = q + sql.SQL(" ORDER BY p.point_embedding <-> %s::vector ASC LIMIT %s")
    params = params + [qvec, search_limit]

    ids_path, fp16_path = paths_for_job(job_id)

    BATCH = min(100, max(10, search_limit))
    with conn.cursor(name="search_stream") as cur:
        cur.itersize = BATCH
        cur.execute(q, params)

        # First row: infer dims, allocate files
        first = cur.fetchone()
        if not first:
            return _empty_store(job_id)
        first_pid, first_bytes = first
        dims = len(first_bytes) // 2

        # Pre-allocate to the LIMIT upper bound, then shrink
        ids_mm = np.memmap(ids_path, dtype=np.int64, mode="w+", shape=(search_limit,))
        Xf16_mm = np.memmap(fp16_path, dtype=np.float16, mode="w+", shape=(search_limit, dims))

        # Write the first row
        i = 0
        ids_mm[i] = int(first_pid)
        Xf16_mm[i] = np.frombuffer(first_bytes, dtype=np.float16, count=dims)
        i += 1

        # Stream remaining rows in batches
        for rows in iter(lambda: cur.fetchmany(BATCH), []):
            if not rows:
                break
            m = len(rows)
            for j in range(m):
                pid, f16_bytes = rows[j]
                ids_mm[i + j] = int(pid)
                Xf16_mm[i + j] = np.frombuffer(f16_bytes, dtype=np.float16, count=dims)
            i += m

    # Flush and truncate to the effective size
    ids_mm.flush(); Xf16_mm.flush()
    del ids_mm; del Xf16_mm  # close memmaps before truncating

    int64_size = np.dtype(np.int64).itemsize
    f16_size = np.dtype(np.float16).itemsize

    with open(ids_path, "r+b") as f:
        f.truncate(i * int64_size)
    with open(fp16_path, "r+b") as f:
        f.truncate(i * dims * f16_size)

    return ids_path, fp16_path, i, dims
