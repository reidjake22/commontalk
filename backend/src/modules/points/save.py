from typing import List, Dict
from .insert import insert_point
from typing import List, Dict
from psycopg2.extras import execute_values

BATCH_LIMIT = 1000  # tweak as you like

def save_points(conn, points: List[tuple]) -> None:
    """
    Bulk insert points given as tuples:
    (contribution_item_id, point_value, point_embedding)
    """
    if not points:
        return

    sql = """
        INSERT INTO point (contribution_item_id, point_value, point_embedding)
        VALUES %s;
    """
    # No template needed for tuples
    with conn:  # commits on success, rollbacks on exception
        with conn.cursor() as cur:
            for i in range(0, len(points), BATCH_LIMIT):
                batch = points[i:i+BATCH_LIMIT]
                execute_values(cur, sql, batch, page_size=BATCH_LIMIT)
