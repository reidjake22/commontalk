from groq import Groq
from typing import Dict, List, Optional, Tuple
from sklearn.cluster import KMeans
import os
from datetime import datetime

def cluster_recursive(points, config, current_depth, parent_cluster_id=None) -> Dict    :
    """Recursively clusters points into sub-clusters."""
    cluster = {
        "layer": current_depth,
        "filters_used": config.get("filters", {}),
        "timestamp": datetime.now().isoformat(),
        "title": None,
        "summary": None,
        "points": points,
        "parent_cluster_id": parent_cluster_id,
    }
    # Perform clustering
    if current_depth > 0:
        cluster["title"] = title_cluster(points)
        cluster["summary"] = summarise_cluster(points, cluster["title"])
    
    cluster_id = save_cluster(cluster)
    if current_depth >= config["max_depth"] or len(points) < config.get("min_points", 5):
        return cluster
    
    cluster["sub_clusters"] = []
    labels = cluster_analysis(points, config)
    clusters_by_label = {}
    for i, label in enumerate(labels):
        if label not in clusters_by_label:
            clusters_by_label[label] = []
        clusters_by_label[label].append(points[i])
    
    for label, cluster_points in clusters_by_label.items():
        sub_cluster = cluster_recursive(cluster_points, config, current_depth + 1, cluster_id)
        cluster["sub_clusters"].append(sub_cluster)

    return cluster

"""
Updated database schema:

Cluster:
- cluster_id (primary key)
- parent_cluster_id (foreign key to cluster_id, NULL for root)
- title (NULL for root)
- summary (NULL for root)
- layer (0 for root, 1, 2, 3...)
- created_at
- filters_used (JSON)

cluster_points:
- cluster_id
- point_id
"""
""" 
Two data objects


Cluster:
parent_cluster_id
cluster_id
cluster_run_id
title
description
centre_vector


table to connect points to clusters:
cluster_points:
cluster_id
point_id

"""
