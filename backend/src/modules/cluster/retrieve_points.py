from typing import List, Dict

def get_debates(conn,filters: Dict) -> List:
    """Get debates based on filters - implement based on your database structure"""
    cursor = conn.cursor()
    query = """
        SELECT ext_id
        FROM debate
        WHERE house = %s
        AND created_at BETWEEN %s AND %s
        AND analysed IS FALSE
        AND EXISTS (
            SELECT 1
            FROM contribution
            WHERE debate_ext_id = debate.ext_id AND member_id IS NOT NULL
        )
    """
    cursor.execute(query, (filters.get("house", "Commons"), filters.get("start_date", "2023-01-01")))
    

def get_points(filters: Dict) -> List[Dict]:
    """Get points from debates based on filters."""
    debates = get_debates(filters)
    points = get_points_from_debate_ids(conn, debates filters)
    return [{"embedding": point[2], "text": point[1], "id": point[0]} for point in points]

def get_points_from_debate_ids(conn, debate_ids: List[str], filters: Dict) -> List[Dict]:
    """ Gonna need to further filter by member_ids if list exists"""
    cursor
