from typing import List, Dict
import json

def save_cluster(conn, cluster: Dict) -> int:
    """Saves a cluster to the database and returns its ID."""
    cursor = conn.cursor()
    
    try:
        # Insert cluster record - ADD config column, REMOVE method column
        cursor.execute("""
            INSERT INTO clusters (parent_cluster_id, title, summary, layer, created_at, filters_used, config, job_id, is_draft)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE)
            RETURNING cluster_id;
        """, (
            cluster.get("parent_cluster_id"),
            cluster.get("title"),
            cluster.get("summary"),
            cluster["layer"],
            cluster["timestamp"],
            json.dumps(cluster.get("filters_used", {})),
            json.dumps(cluster.get("config", {})),
            cluster['config']['job_id']
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
        
        return cluster_id
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()