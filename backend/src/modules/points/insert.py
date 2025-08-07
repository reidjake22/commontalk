import psycopg2

def insert_point(conn: psycopg2.extensions.connection, contribution_item_id: str, point_value: str, point_embedding: list) -> None:
    """ Saves a point to the database. """
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO point (contribution_item_id, point_value, point_embedding)
        VALUES (%s, %s, %s);
    """, (contribution_item_id, point_value, point_embedding))
    cursor.close()