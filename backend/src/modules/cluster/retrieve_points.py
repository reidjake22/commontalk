# Imports
from typing import List, Dict
from modules.points.embed import embed
import json
### MAIN FUNCTION ####


def get_points(conn, filters: Dict) -> List[Dict]:
    """Get points directly with a single query"""
    cursor = conn.cursor()
    
    query = """
        SELECT p.point_id, p.point_value, p.point_embedding
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN debate d ON c.debate_ext_id = d.ext_id
        AND p.point_embedding IS NOT NULL
        AND c.member_id IS NOT NULL
    """
    params = []
    
    # Add filters dynamically
    if filters.get("house"):
        query += " AND d.house = %s"
        params.append(filters["house"])
    
    if filters.get("start_date"):
        query += " AND d.date >= %s"
        params.append(filters["start_date"])
    
    if filters.get("end_date"):
        query += " AND d.date <= %s"
        params.append(filters["end_date"])
        
    if filters.get("member_ids"):
        query += " AND c.member_id = ANY(%s)"
        params.append(filters["member_ids"])
     
    cursor.execute(query, params)
    results = cursor.fetchall()
    cursor.close()    
    points = []
    for point in results:
        embedding_raw = point[2]
        
        # Convert PostgreSQL VECTOR to Python list
        try:
            if isinstance(embedding_raw, str):
                # Handle string format like "[1.0,2.0,3.0]"
                embedding_str = embedding_raw.strip('[]')
                embedding = [float(x.strip()) for x in embedding_str.split(',')]
            else:
                # If it's already a list/array, use as-is
                embedding = list(embedding_raw)
                
        except (ValueError, AttributeError) as e:
            print(f"Error parsing embedding for point {point[0]}: {e}")
            print(f"Raw embedding: {repr(embedding_raw[:100])}")
            continue
        
        points.append({
            "embedding": embedding,
            "text": point[1], 
            "id": point[0]
        })
    
    return points

def get_top_points_by_embedding(conn, filters: Dict, search_term: str, limit: int = 1000) -> List[Dict]:
    """Get top N points filtered by metadata and ordered by embedding distance to search_term."""
    embedding = embed(search_term)  # Your embedding function
    cursor = conn.cursor()

    query = """
        SELECT p.point_id, p.point_value, p.point_embedding,
               (p.point_embedding <-> %s::vector) AS distance
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN debate d ON c.debate_ext_id = d.ext_id
        WHERE p.point_embedding IS NOT NULL
          AND c.member_id IS NOT NULL
    """
    params = [embedding]

    # Add filters dynamically
    if filters.get("house"):
        query += " AND d.house = %s"
        params.append(filters["house"])
    if filters.get("start_date"):
        query += " AND d.date >= %s"
        params.append(filters["start_date"])
    if filters.get("end_date"):
        query += " AND d.date <= %s"
        params.append(filters["end_date"])
    if filters.get("member_ids"):
        query += " AND c.member_id = ANY(%s)"
        params.append(filters["member_ids"])

    query += " ORDER BY distance ASC LIMIT %s"
    params.append(limit)

    cursor.execute(query, params)
    results = cursor.fetchall()
    cursor.close()

    points = []
    for point in results:
        embedding_raw = point[2]
        try:
            if isinstance(embedding_raw, str):
                embedding_str = embedding_raw.strip('[]')
                embedding = [float(x.strip()) for x in embedding_str.split(',')]
            else:
                embedding = list(embedding_raw)
        except (ValueError, AttributeError) as e:
            print(f"Error parsing embedding for point {point[0]}: {e}")
            continue

        points.append({
            "embedding": embedding,
            "text": point[1],
            "id": point[0],
            "distance": point[3]
        })

    return points
