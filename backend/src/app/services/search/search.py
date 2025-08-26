# backend/src/app/services/search/search.py

# Project imports
from modules.cluster.run import run_clustering
from modules.utils.cluster_utils import create_job
from modules.utils.executor_utils import submit
from app.common.errors import ApiError, ServerError

def search(search_terms: dict ):
    config = {
        "max_depth": 1,
        "min_points": 5,
        "skip_llm": False,
        "search": True,
        "n_clusters": 3,
        "n_clusters_base": 3,
    }
    params = {
        "filters": search_terms,
        "config" : config
    }
    try:
        job_id = create_job(params)
        config["job_id"] = job_id
        submit(run_clustering, config, search_terms)
        return job_id
    except ValueError as e:
        # Example: invalid job parameters
        raise ApiError("invalid_params", f"Invalid job parameters: {e}", status_code=400)
    except Exception as e:
        # Unexpected error
        raise ServerError("search_error", "An unexpected error occurred while creating the search job.")