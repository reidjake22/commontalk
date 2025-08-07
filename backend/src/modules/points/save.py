from typing import List, Dict
from .insert import insert_point
def save_points(conn, points: List[Dict]) -> None:
    """ Saves points to the database. """
    for point in points:
        try:
            insert_point(conn, point['contribution_item_id'], point['point_value'], point['point_embedding'])
        except Exception as e:
            print(f"Error inserting point for contribution item {point['contribution_item_id']}: {e}")
    conn.commit()
    