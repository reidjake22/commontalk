# Imports
import logging

from app import config
import numpy as np

# Relative Imports
from .recursion import cluster_recursive_idx
from ..utils.database_utils import get_db_connection
from ..utils.cluster_utils import finalise_job
# in modules/cluster/run.py
from .store import build_local_fp16_store, cleanup_store
# modules/cluster/run.py
def run_clustering(config, filters=None):
    conn = get_db_connection()
    filters = filters or {}
    if filters.get("member"):
        filters["member_ids"] = [filters["member"]]

    dims = config.get("dims", 256)
    ids_path, fp16_path, N, D = build_local_fp16_store(conn, filters, dims=dims, job_id=int(config["job_id"]), prefer_db_fp16=True)
    if N == 0:
        logging.warning("No points found.")
        conn.close()
        return

    config["scratch"] = {"ids_path": ids_path, "fp16_path": fp16_path, "dims": D, "N": N}
    root_idx = np.arange(N, dtype=np.int64)
    cluster_recursive_idx(conn, root_idx, config, filters, depth=0)

    conn.close()
    if config.get('job_id') != "1000000":
        finalise_job(config['job_id'])
    cleanup_store(int(config["job_id"]), dims=D)


def main():
    from modules.utils.cluster_utils import create_job
    config = {
        "method": "kmeans",
        "search": False,
        "skip_llm": True,
        "max_depth": 2,
        "min_points": 3,
        "n_clusters": 3,
        "n_clusters_base": 5,
        "dims": 64
    }
    filters = {
        "end_date": "2025-07-16",
        "start_date": "2025-05-17"
    }
    params = {"config": config, "filters": filters}
    print("creating job")
    job_id = create_job(params)
    print(f"job_id: {job_id}")
    config["job_id"] = job_id
    run_clustering(config, filters)

if __name__ == "__main__":
    main()