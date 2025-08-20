from .models import SearchTerms
from modules.cluster.run import run_clustering
from modules.utils.cluster_utils import create_job
from modules.utils.executor_utils import submit

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
    job_id = create_job(params)
    config["job_id"] = job_id
    print("Submitting clustering job with ID:", job_id)
    submit(run_clustering, config, search_terms)
    return job_id


    