from typing import Dict, List
from sklearn.cluster import KMeans
import logging

def cluster_analysis(points, config, is_top: bool) -> List[str]:
    """Performs clustering analysis on the points."""
    analysis_method = config.get("method", "kmeans")
    match analysis_method:
        case "kmeans":
            n_clusters = config.get("n_clusters_base", 3) if is_top and config.get("n_clusters_base", 3) else config.get("n_clusters", 5)
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            labels = kmeans.fit_predict([point['embedding'] for point in points])
            return labels.tolist()
        case _:
            logging.error(f"Unknown clustering method: {analysis_method}")
            raise ValueError(f"Unknown clustering method: {analysis_method}")
    # Additional clustering methods can be added here
    return []
