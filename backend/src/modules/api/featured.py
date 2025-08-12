from flask import jsonify
from pydantic import BaseModel
from typing import List, Optional, Union
from .cluster import get_or_create_monthly_clustering


class PersonWidget(BaseModel):
    id: int
    party_id: int
    name: str

class Topic(BaseModel):
    id: Union[int, str]
    title: str
    summary: str
    subTopics: Optional[List['Topic']] = None  # Use string for forward reference
    proportions: List[tuple[int, int]] = []
    contributors: List[PersonWidget] = []

# Update forward reference after class definition
Topic.model_rebuild()

def get_featured_topics():
    """Fetches featured topics from the database."""
    from datetime import datetime
    
    try:
        today = datetime.now()
        config = {
            "max_depth": 2,
            "min_points": 3,
            "n_clusters": 3,
            "skip_llm": False,
            "method": "kmeans",
            "n_clusters_base": 10,  # Base number of clusters for top-level clustering
        }
        
        # Pass today as a datetime object, or convert to string if needed
        cluster_result = get_or_create_monthly_clustering(
            target_date=today.strftime('%Y-%m-%d'),
            config=config
        )
        
        # Extract the actual data - adjust based on what get_or_create_monthly_clustering returns
        if hasattr(cluster_result, 'json'):
            cluster_data = cluster_result.json
        else:
            cluster_data = cluster_result
            
        # Get sub_clusters from the data
        topics = cluster_data.get("data", {}).get("sub_clusters", [])
        
        # Format for frontend
        formatted_topics = []
        for i, cluster in enumerate(topics[:5]):
            proportions = get_proportions(cluster)
            contributors = get_contributors(cluster)
            formatted_topics.append({
                "id": cluster.get("cluster_id", i),
                "title": cluster.get("title", f"Topic {i+1}"),
                "summary": cluster.get("summary", "Parliamentary discussion..."),
                "subTopics": cluster.get("sub_clusters", []),
                "proportions": proportions,  # List of [party_id, count]
                "contributors": contributors,  # List of PersonWidget dicts
            })
        
        return jsonify({
            'success': True,
            'data': formatted_topics,
            'cached': cluster_data.get("cached", False),
            'date_range': cluster_data.get("date_range", {})
        })
        
    except Exception as e:
        print(f"Error in get_featured_topics: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

def get_proportions(cluster):
    """Extracts proportions from a cluster by counting points grouped by party."""
    if not cluster or 'cluster_id' not in cluster:
        return []
    
    from ..utils.database_utils import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # SQL query to get party counts for a cluster
        query = """
        SELECT 
            m.latest_party_membership,
            COUNT(cp.point_id) as point_count
        FROM cluster_points cp
        JOIN point p ON cp.point_id = p.point_id
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN member m ON c.member_id = m.member_id
        WHERE cp.cluster_id = %s
        GROUP BY m.latest_party_membership
        ORDER BY point_count DESC;
        """
        
        cursor.execute(query, [cluster['cluster_id']])
        results = cursor.fetchall()
        
        # Convert to list of tuples [party_id, count]
        # Note: party_id is now a VARCHAR, not int
        proportions = [[row[0], row[1]] for row in results]
        return proportions
        
    except Exception as e:
        print(f"Error getting proportions for cluster {cluster.get('cluster_id')}: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_contributors(cluster, limit=5):
    """Gets top contributors (members) for a cluster by point count."""
    if not cluster or 'cluster_id' not in cluster:
        return []
    
    from ..utils.database_utils import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # SQL query to get top contributing members for a cluster
        query = """
        SELECT 
            m.member_id,
            m.latest_party_membership,
            m.name_display_as,
            COUNT(cp.point_id) as point_count
        FROM cluster_points cp
        JOIN point p ON cp.point_id = p.point_id
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN member m ON c.member_id = m.member_id
        WHERE cp.cluster_id = %s
        GROUP BY m.member_id, m.latest_party_membership, m.name_display_as
        ORDER BY point_count DESC
        LIMIT %s;
        """
        
        cursor.execute(query, [cluster['cluster_id'], limit])
        results = cursor.fetchall()
        
        # Convert to list of PersonWidget-compatible dicts
        contributors = []
        for row in results:
            contributors.append({
                "id": row[0],           # member_id (VARCHAR)
                "party_id": row[1],     # latest_party_membership (VARCHAR)
                "name": row[2]          # name_display_as
            })
        
        return contributors
        
    except Exception as e:
        print(f"Error getting contributors for cluster {cluster.get('cluster_id')}: {e}")
        return []
    finally:
        cursor.close()
        conn.close()
