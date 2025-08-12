from typing import List, Dict
import json

def save_cluster(conn, cluster: Dict) -> int:
    """Saves a cluster to the database and returns its ID."""
    cursor = conn.cursor()
    
    try:
        # Insert cluster record - ADD config column, REMOVE method column
        cursor.execute("""
            INSERT INTO clusters (parent_cluster_id, title, summary, layer, created_at, filters_used, config)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING cluster_id;
        """, (
            cluster.get("parent_cluster_id"),
            cluster.get("title"),
            cluster.get("summary"),
            cluster["layer"],
            cluster["timestamp"],
            json.dumps(cluster.get("filters_used", {})),
            json.dumps(cluster.get("config", {}))  # ADD this line, REMOVE method
        ))
        
        cluster_id = cursor.fetchone()[0]
        
        # Save cluster-point relationships (unchanged)
        if cluster.get("points"):
            for point in cluster["points"]:
                point_id = point["id"]
                cursor.execute("""
                    INSERT INTO cluster_points (cluster_id, point_id)
                    VALUES (%s, %s)
                """, (cluster_id, point_id))
        
        conn.commit()
        return cluster_id
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()