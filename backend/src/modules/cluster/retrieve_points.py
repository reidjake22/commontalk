# Imports
from typing import List, Dict
from psycopg2 import sql
from pgvector.psycopg2 import register_vector, vector
from modules.points.embed import embed


def get_points(conn, filters: Dict, dims: int = 64) -> List[Dict]:
    """
    Returns [{"embedding": list[float], "text": str, "id": <id>}] with embeddings
    truncated server-side to the first `dims` components.
    """
    register_vector(conn)
    cur = conn.cursor()

    # Build the slice expression once: (p.point_embedding::real[])[1:dims]
    emb_slice = sql.SQL("(p.point_embedding::real[])[1:{d}]").format(
        d=sql.Literal(dims)
    )

    base = sql.SQL("""
        SELECT p.point_id, p.point_value, {emb_slice} AS emb
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN debate d       ON c.debate_ext_id = d.ext_id
        WHERE p.point_embedding IS NOT NULL
          AND c.member_id IS NOT NULL
    """).format(emb_slice=emb_slice)

    clauses = []
    params: List = []
    if filters.get("house"):
        clauses.append(sql.SQL("d.house = %s"));        params.append(filters["house"])
    if filters.get("start_date"):
        clauses.append(sql.SQL("d.date >= %s"));        params.append(filters["start_date"])
    if filters.get("end_date"):
        clauses.append(sql.SQL("d.date <= %s"));        params.append(filters["end_date"])
    if filters.get("member_ids"):
        clauses.append(sql.SQL("c.member_id = ANY(%s)")); params.append(filters["member_ids"])

    query = base
    if clauses:
        query = query + sql.SQL(" AND ") + sql.SQL(" AND ").join(clauses)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    print(f"truncated to {len(rows[0][2])} dims")
    # emb comes back as Python list[float] (real[]), so no string parsing
    return [{"embedding": emb, "text": val, "id": pid} for (pid, val, emb) in rows]


def get_top_points_by_embedding(conn, filters: Dict, search_term: str,
                                limit: int = 1000, dims: int = 256) -> List[Dict]:
    """
    Ranks by distance using truncated vectors on BOTH sides:
      ((p.point_embedding::real[])[1:d]::vector(d)) <-> vector(q[:d])
    """
    register_vector(conn)
    qvec_trunc = vector(embed(search_term)[:dims])

    cur = conn.cursor()

    # Expression for truncated & cast-back vector on the table side:
    # ((p.point_embedding::real[])[1:d]::vector(d))
    trunc_vec_expr = sql.SQL("((p.point_embedding::real[])[1:{d}]::vector({d}))").format(
        d=sql.Literal(dims)
    )

    base = sql.SQL("""
        SELECT
          p.point_id,
          p.point_value,
          {trunc_expr} AS emb,
          ({trunc_expr} <-> %s) AS distance
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN debate d       ON c.debate_ext_id = d.ext_id
        WHERE p.point_embedding IS NOT NULL
          AND c.member_id IS NOT NULL
    """).format(trunc_expr=trunc_vec_expr)

    clauses = []
    params: List = [qvec_trunc]
    if filters.get("house"):
        clauses.append(sql.SQL("d.house = %s"));        params.append(filters["house"])
    if filters.get("start_date"):
        clauses.append(sql.SQL("d.date >= %s"));        params.append(filters["start_date"])
    if filters.get("end_date"):
        clauses.append(sql.SQL("d.date <= %s"));        params.append(filters["end_date"])
    if filters.get("member_ids"):
        clauses.append(sql.SQL("c.member_id = ANY(%s)")); params.append(filters["member_ids"])

    query = base
    if clauses:
        query = query + sql.SQL(" AND ") + sql.SQL(" AND ").join(clauses)

    query = query + sql.SQL(" ORDER BY distance ASC LIMIT %s")
    params.append(limit)

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    print(f"truncated to {len(rows[0][2])} dims")

    # emb is a pgvector (sequence) here; convert to list for your current shape
    return [{"embedding": list(emb), "text": val, "id": pid, "distance": dist}
            for (pid, val, emb, dist) in rows]

# modules/cluster/retrieve_points_ids.py
from typing import List, Dict

def get_points_ids_and_text(conn, filters: Dict, limit_text_per_point: bool = True) -> List[Dict]:
    """
    Returns only id + text (no embeddings), for LLM titling/summary and save_cluster().
    """
    cur = conn.cursor()
    q = """
      SELECT p.point_id, p.point_value
      FROM point p
      JOIN contribution c ON p.contribution_item_id = c.item_id
      JOIN debate d       ON c.debate_ext_id = d.ext_id
      WHERE p.point_embedding IS NOT NULL
        AND c.member_id IS NOT NULL
    """
    params = []
    if filters.get("house"):      q += " AND d.house = %s";       params.append(filters["house"])
    if filters.get("start_date"): q += " AND d.date >= %s";       params.append(filters["start_date"])
    if filters.get("end_date"):   q += " AND d.date <= %s";       params.append(filters["end_date"])
    if filters.get("member_ids"): q += " AND c.member_id = ANY(%s)"; params.append(filters["member_ids"])

    cur.execute(q, params)
    rows = cur.fetchall()
    cur.close()
    # keep structure your code expects
    return [{"id": pid, "text": val} for (pid, val) in rows]
