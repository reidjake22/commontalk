from groq import Groq
from typing import Dict, List, Optional, Tuple
from sklearn.cluster import KMeans
import os
from datetime import datetime
from .llm_labelling import summarise_cluster, title_cluster
from .save import save_cluster
from .analysis import cluster_analysis

def cluster_recursive(conn, points: List[Dict], config, filters, current_depth, parent_cluster_id=None) -> Dict:
    """Recursively clusters points into sub-clusters."""
    cluster = {
        "layer": current_depth,
        "filters_used": filters,
        "method": config.get("method"),
        "timestamp": datetime.now().isoformat(),
        "title": None,
        "summary": None,
        "points": points,
        "parent_cluster_id": parent_cluster_id,
    }
    # Perform clustering
    if current_depth > 0 and not (config.get("skip_llm")):
        cluster["title"] = title_cluster(points)
        cluster["summary"] = summarise_cluster(points, cluster["title"])
    
    cluster_id = save_cluster(conn, cluster)
    cluster["cluster_id"] = cluster_id
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
        sub_cluster = cluster_recursive(conn, cluster_points, config, filters, current_depth + 1, cluster_id)
        cluster["sub_clusters"].append(sub_cluster)

    return cluster