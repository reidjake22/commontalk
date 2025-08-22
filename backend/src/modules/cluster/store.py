# modules/cluster/store.py
import os, tempfile
import numpy as np
from typing import Dict, Tuple, List
from psycopg2 import sql

TMP_DIR = tempfile.gettempdir()

def paths_for_job(job_id: int, dims: int):
    ids_path  = os.path.join(TMP_DIR, f"ids_{job_id}.dat")      # <- .dat, not .npy
    fp16_path = os.path.join(TMP_DIR, f"Xfp16_{job_id}_{dims}d.dat")
    return ids_path, fp16_path

def count_points(conn, filters: Dict) -> int:
    q = """
      SELECT COUNT(*)
      FROM point p
      JOIN contribution c ON p.contribution_item_id = c.item_id
      JOIN debate d       ON c.debate_ext_id = d.ext_id
      WHERE p.point_embedding IS NOT NULL AND c.member_id IS NOT NULL
    """
    params = []
    if filters.get("house"):
        q += " AND d.house = %s";        params.append(filters["house"])
    if filters.get("start_date"):
        q += " AND d.date >= %s";        params.append(filters["start_date"])
    if filters.get("end_date"):
        q += " AND d.date <= %s";        params.append(filters["end_date"])
    if filters.get("member_ids"):
        q += " AND c.member_id = ANY(%s)"; params.append(filters["member_ids"])
    with conn.cursor() as cur:
        cur.execute(q, params)
        return cur.fetchone()[0]

def build_local_fp16_store(conn, filters: Dict, dims: int, job_id: int, prefer_db_fp16: bool = True) -> Tuple[str, str, int, int]:
    """
    Streams points and writes:
      ids.npy:  int64 shape (N,)
      Xfp16.dat: float16 memmap shape (N, dims)
    Returns (ids_path, fp16_path, N, dims).
    """
    ids_path, fp16_path = paths_for_job(job_id, dims)
    N = count_points(conn, filters)
    if N == 0:
        np.save(ids_path, np.empty(0, dtype=np.int64))
        open(fp16_path, "wb").close()
        return ids_path, fp16_path, 0, dims

    ids = np.memmap(ids_path, dtype=np.int64, mode="w+", shape=(N,))
    Xf16 = np.memmap(fp16_path, dtype=np.float16, mode="w+", shape=(N, dims))
    BATCH = 30

    with conn.cursor(name="points_stream") as cur:
        cur.itersize = BATCH
        if prefer_db_fp16:
            trunc = sql.SQL("substring(p.emb256_f16 FROM 1 FOR {n})").format(n=sql.Literal(dims*2))
            base = sql.SQL("""
              SELECT p.point_id, {trunc} AS q_bytes
              FROM point p
              JOIN contribution c ON p.contribution_item_id = c.item_id
              JOIN debate d       ON c.debate_ext_id = d.ext_id
              WHERE p.emb256_f16 IS NOT NULL AND c.member_id IS NOT NULL
            """).format(trunc=trunc)
        else:
            base = sql.SQL("""
              SELECT p.point_id, (p.point_embedding::real[])[1:{d}] AS emb
              FROM point p
              JOIN contribution c ON p.contribution_item_id = c.item_id
              JOIN debate d       ON c.debate_ext_id = d.ext_id
              WHERE p.point_embedding IS NOT NULL AND c.member_id IS NOT NULL
            """).format(d=sql.Literal(dims))

        clauses, params = [], []
        if filters.get("house"):      clauses += [sql.SQL("d.house = %s")];      params += [filters["house"]]
        if filters.get("start_date"): clauses += [sql.SQL("d.date >= %s")];      params += [filters["start_date"]]
        if filters.get("end_date"):   clauses += [sql.SQL("d.date <= %s")];      params += [filters["end_date"]]
        if filters.get("member_ids"): clauses += [sql.SQL("c.member_id = ANY(%s)")]; params += [filters["member_ids"]]

        q = base if not clauses else base + sql.SQL(" AND ") + sql.SQL(" AND ").join(clauses)
        cur.execute(q, params)

        i = 0
        for rows in iter(lambda: cur.fetchmany(BATCH), []):
            m = len(rows)
            ids[i:i+m] = [r[0] for r in rows]
            if prefer_db_fp16:
                blob = b"".join(r[1] for r in rows)
                Xb = np.frombuffer(blob, dtype=np.float16, count=m*dims).reshape(m, dims)
                Xf16[i:i+m] = Xb
            else:
                X = np.asarray([r[1] for r in rows], dtype=np.float32)
                Xf16[i:i+m] = X.astype(np.float16)
            i += m

    ids.flush(); Xf16.flush()
    return ids_path, fp16_path, N, dims

def cleanup_store(job_id: int, dims: int):
    ids_path, fp16_path = paths_for_job(job_id, dims)
    for p in (ids_path, fp16_path):
        try: os.remove(p)
        except OSError: pass


