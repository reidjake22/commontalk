# modules/cluster/analysis.py
import numpy as np
from sklearn.cluster import MiniBatchKMeans
from typing import List, Dict
# modules/cluster/analysis.py
import numpy as np
from sklearn.cluster import MiniBatchKMeans
from typing import List, Dict

def cluster_analysis(points: List[Dict], config, is_top: bool) -> List[int]:
    """Legacy points-based path (discouraged). Uses memmap but builds an id->row dict."""
    dims = config["scratch"]["dims"]
    fp16_path = config["scratch"]["fp16_path"]
    N = int(config["scratch"]["N"])
    ids_path = config["scratch"]["ids_path"]

    ids_all = np.memmap(ids_path, dtype=np.int64, mode="r", shape=(N,))
    id_to_row = config["scratch"].get("id_to_row")
    if id_to_row is None:
        # WARNING: big dict for large N; prefer the indices path instead.
        id_to_row = {int(pid): i for i, pid in enumerate(ids_all)}
        config["scratch"]["id_to_row"] = id_to_row

    idx = np.fromiter((id_to_row[p["id"]] for p in points), dtype=np.int64, count=len(points))
    Xf16 = np.memmap(fp16_path, dtype=np.float16, mode="r", shape=(N, dims))

    n_clusters = (config.get("n_clusters_base", 3) if is_top and config.get("n_clusters_base")
                  else config.get("n_clusters", 5))
    batch = min(8192, max(1024, 32 * n_clusters))
    km = MiniBatchKMeans(n_clusters=n_clusters, batch_size=batch, init_size=max(10*n_clusters, 3*batch),
                         n_init="auto", random_state=42, max_iter=100)

    for s in range(0, idx.size, batch):
        sl = idx[s:s+batch]
        km.partial_fit(Xf16[sl].astype(np.float32, copy=False))

    labels = np.empty(idx.size, dtype=np.int32)
    p = 0
    for s in range(0, idx.size, batch):
        sl = idx[s:s+batch]
        labels[p:p+sl.size] = km.predict(Xf16[sl].astype(np.float32, copy=False))
        p += sl.size
    return labels.tolist()

def cluster_analysis_by_indices(idx: np.ndarray, config: Dict, is_top: bool) -> list[int]:
    """Preferred path: purely index-based, no dicts, minimal RAM."""
    dims = config["scratch"]["dims"]
    N = int(config["scratch"]["N"])
    Xf16 = np.memmap(config["scratch"]["fp16_path"], dtype=np.float16, mode="r", shape=(N, dims))

    n_clusters = (config.get("n_clusters_base", 3) if is_top and config.get("n_clusters_base")
                  else config.get("n_clusters", 5))
    batch = min(8192, max(1024, 32 * n_clusters))
    km = MiniBatchKMeans(n_clusters=n_clusters, batch_size=batch, init_size=max(10*n_clusters, 3*batch),
                         n_init="auto", random_state=42, max_iter=100)

    for s in range(0, idx.size, batch):
        km.partial_fit(Xf16[idx[s:s+batch]].astype(np.float32, copy=False))

    labels = np.empty(idx.size, dtype=np.int32)
    p = 0
    for s in range(0, idx.size, batch):
        sl = idx[s:s+batch]
        labels[p:p+sl.size] = km.predict(Xf16[sl].astype(np.float32, copy=False))
        p += sl.size
    return labels.tolist()
