from groq import Groq
from typing import Dict, List, Optional, Tuple
from sklearn.cluster import KMeans
import os
import numpy as np
from datetime import datetime
from .llm_labelling import summarise_cluster, title_cluster, fetch_text_samples
from .save import save_cluster_ids
from .analysis import cluster_analysis_by_indices
# modules/cluster/recursion.py
import numpy as np
from .analysis import cluster_analysis_by_indices
from .save import save_cluster_ids
from datetime import datetime

def cluster_recursive_idx(conn, idx, config, filters, depth, parent_cluster_id=None):
    N = int(config["scratch"]["N"])
    ids_all = np.memmap(config["scratch"]["ids_path"], dtype=np.int64, mode="r", shape=(N,))
    point_ids = ids_all[idx].astype(int).tolist()

    title = summary = None
    if (depth > 0 or config.get("search")) and not config.get("skip_llm"):
        texts = fetch_text_samples(conn, point_ids, sample_size=30)
        if texts:
            faux_points = [{"text": t} for t in texts]
            if depth == 0:
                title = filters.get("query", "")
            else:
                title = title_cluster(faux_points, filters.get("query", ""))
            summary = summarise_cluster(faux_points, title)

    cluster_id = save_cluster_ids(conn, parent_cluster_id=parent_cluster_id, layer=depth,
                                  filters_used=filters, config=config, job_id=config["job_id"],
                                  title=title, summary=summary,
                                  point_ids=point_ids)

    if depth >= config["max_depth"] or len(idx) < config.get("min_points", 5):
        return

    labels = np.asarray(cluster_analysis_by_indices(idx, config, is_top=(depth == 0)), dtype=np.int32)
    order = np.argsort(labels, kind="stable")
    labels_sorted = labels[order]; idx_sorted = idx[order]
    uniq, starts = np.unique(labels_sorted, return_index=True)
    starts = list(starts) + [len(labels_sorted)]

    for j in range(len(uniq)):
        child_idx = idx_sorted[starts[j]:starts[j+1]]
        if child_idx.size:
            cluster_recursive_idx(conn, child_idx, config, filters, depth + 1, parent_cluster_id=cluster_id)
