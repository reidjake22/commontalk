# modules/cluster/save_ids.py
from typing import Dict, List
from psycopg2.extras import execute_values
import json
from modules.points.embed import embed
def save_cluster_ids(conn, *, parent_cluster_id, layer, filters_used, config, job_id, title=None, summary=None, point_ids: List[int] = None) -> int:
    title_embedding = embed(title) if title else None
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO clusters (parent_cluster_id, title, summary, layer, filters_used, config, job_id, visible, title_embedding)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, FALSE, %s)
            RETURNING cluster_id
        """, (parent_cluster_id, title, summary, layer,
              json.dumps(filters_used or {}), json.dumps(config or {}), job_id, title_embedding))
        cluster_id = cur.fetchone()[0]

        if point_ids:
            rows = [(cluster_id, pid) for pid in point_ids]
            execute_values(cur, """
                INSERT INTO cluster_points (cluster_id, point_id)
                VALUES %s
                ON CONFLICT (cluster_id, point_id) DO NOTHING
            """, rows, template="(%s,%s)")
    conn.commit()
    return cluster_id
