# modules/cluster/run.py
import logging
import numpy as np

from .recursion import cluster_recursive_idx
from ..utils.database_utils import get_db_connection
from ..utils.cluster_utils import finalise_job
from .store import (
    build_local_fp16_store,
    build_local_fp16_store_search,
    cleanup_store,
)

def run_clustering(config, filters=None):
    conn = get_db_connection()
    filters = dict(filters or {})

    # Normalise single member -> list
    if filters.get("member"):
        filters["member_ids"] = [filters["member"]]

    job_id = int(config.get("job_id"))
    search_limit = int(config.get("search_limit", 500))

    try:
        # Choose search vs full export
        if filters.get("query"):
            ids_path, fp16_path, N, dims = build_local_fp16_store_search(
                conn,
                filters,
                job_id,
                search_limit=search_limit,
            )
        else:
            ids_path, fp16_path, N, dims = build_local_fp16_store(
                conn,
                filters,
                job_id,
            )

        if N == 0:
            logging.warning("No points found.")
            # Clean up any empty files we just created and bail
            cleanup_store(job_id)
            return

        # Scratch paths for downstream clustering
        config["scratch"] = {
            "ids_path": ids_path,
            "fp16_path": fp16_path,
            "dims": dims,
            "N": N,
        }

        # Run clustering over [0..N)
        root_idx = np.arange(N, dtype=np.int64)
        cluster_recursive_idx(conn, root_idx, config, filters, depth=0)

    finally:
        conn.close()
        # Keep your sentinel job-id behaviour
        if str(config.get("job_id")) != "1000000":
            finalise_job(config["job_id"])
        # Remove local tmp files
        cleanup_store(job_id)


def main():
    from modules.utils.cluster_utils import create_job

    config = {
        "method": "kmeans",
        "search": True,
        "skip_llm": False,
        "max_depth": 2,
        "min_points": 3,
        "n_clusters": 3,
        "n_clusters_base": 5,
        # dims no longer used; left here harmlessly if present in your config dict
        # "dims": 64,
        "search_limit": 500,
    }
    filters = {
        "end_date": "2025-07-16",
        "start_date": "2025-05-17",
        "query": "Gaza",  # enable to use the search path
    }

    params = {"config": config, "filters": filters}
    print("creating job")
    job_id = create_job(params)
    print(f"job_id: {job_id}")
    config["job_id"] = job_id
    run_clustering(config, filters)


if __name__ == "__main__":
    main()
