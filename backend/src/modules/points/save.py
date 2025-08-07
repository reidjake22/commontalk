from typing import List, Dict
from .insert import insert_point
def save_points(conn, points: List[Dict]) -> None:
    """ Saves points to the database. """
    for point in points:
        try:
            insert_point(conn, point[0], point[1], point[2])
        except Exception as e:
            print(f"Error inserting point for contribution item {point['contribution_item_id']}: {e}")
    conn.commit()