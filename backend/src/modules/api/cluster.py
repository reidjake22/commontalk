from datetime import datetime, timedelta
from flask import Flask, jsonify
from modules.cluster.run import run_clustering
from typing import Dict
from ..utils.database_utils import get_db_connection
def get_or_create_weekly_clustering(target_date=None):
    conn = get_db_connection()
    try:
        if target_date:
            end_date = datetime.strptime(target_date, '%Y-%m-%d') # Check if this ends up being inclusive
        else:
            end_date = datetime.now()

        start_date = end_date - timedelta(days=6)

        filters = {
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d')
        }

        exists = check_if_cluster_exists(conn, filters)
        if exists:
            print("Cluster already exists, retrieving from database")
            cluster = get_cluster(conn, filters)
        if not exists:
            print("No existing cluster found, running clustering")
            cluster = run_clustering(filters=filters)

        return jsonify({
            'success': True,
            'data': cluster,
            'cached': exists,
            'date_range': filters
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def check_if_cluster_exists(conn, filters: Dict) -> bool:
    """Check if a cluster already exists for the given filters."""
    cursor = conn.cursor()
    query = """
        SELECT COUNT(*) FROM clusters
        WHERE filters_used @> %s::jsonb
    """
    params = [json.dumps(filters)]
    cursor.execute(query, params)
    exists = cursor.fetchone()[0] > 0
    cursor.close()
    return exists

import json
from typing import Dict, Optional

def get_cluster(conn, filters: Dict) -> Dict:
    """
    Retrieve existing cluster tree in the same format as cluster_recursive produces
    """
    # Find the root cluster (layer 0, no parent) that matches the filters
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT cluster_id, title, summary, layer, created_at, filters_used, method, parent_cluster_id
            FROM clusters 
            WHERE layer = 0 
            AND parent_cluster_id IS NULL
            AND filters_used @> %s::jsonb
            ORDER BY created_at DESC
            LIMIT 1;
        """, [json.dumps(filters)])
        
        root_row = cursor.fetchone()
        if not root_row:
            cursor.close()
            return {}
        
        # Build the full tree starting from root
        root_cluster = build_cluster_tree(conn, root_row[0])
        cursor.close()
        return root_cluster
        
    except Exception as e:
        cursor.close()
        print(f"Error retrieving cluster: {e}")
        return {}

def build_cluster_tree(conn, cluster_id: int) -> Dict:
    """
    Recursively build cluster tree in the same format as cluster_recursive
    """
    cursor = conn.cursor()
    
    try:
        # Get cluster details
        cursor.execute("""
            SELECT cluster_id, title, summary, layer, created_at, filters_used, method, parent_cluster_id
            FROM clusters 
            WHERE cluster_id = %s;
        """, [cluster_id])
        
        cluster_row = cursor.fetchone()
        if not cluster_row:
            cursor.close()
            return {}
        
        # Build cluster object matching recursion.py format
        cluster = {
            "cluster_id": cluster_row[0],
            "title": cluster_row[1],
            "summary": cluster_row[2], 
            "layer": cluster_row[3],
            "timestamp": cluster_row[4].isoformat() if cluster_row[4] else None,
            "filters_used": cluster_row[5] if cluster_row[5] else {},
            "method": cluster_row[6],
            "parent_cluster_id": cluster_row[7],
            "points": [],
            "sub_clusters": []
        }
        
        # Get points for this cluster
        cursor.execute("""
            SELECT p.point_id, p.point_value
            FROM cluster_points cp
            JOIN point p ON cp.point_id = p.point_id
            WHERE cp.cluster_id = %s
            ORDER BY p.point_id;
        """, [cluster_id])
        
        points = []
        for point_row in cursor.fetchall():
            points.append({
                'id': point_row[0],
                'text': point_row[1]
                # Note: embeddings will be stripped by strip_embeddings() in run_clustering
            })
        
        cluster['points'] = points
        
        # Get sub-clusters (children)
        cursor.execute("""
            SELECT cluster_id 
            FROM clusters 
            WHERE parent_cluster_id = %s
            ORDER BY cluster_id;
        """, [cluster_id])
        
        sub_cluster_ids = [row[0] for row in cursor.fetchall()]
        
        # Recursively build sub-clusters
        if sub_cluster_ids:
            for sub_id in sub_cluster_ids:
                sub_cluster = build_cluster_tree(conn, sub_id)
                if sub_cluster:  # Only add if successfully built
                    cluster['sub_clusters'].append(sub_cluster)
        
        cursor.close()
        return cluster
        
    except Exception as e:
        cursor.close()
        print(f"Error building cluster tree for ID {cluster_id}: {e}")
        return {}
