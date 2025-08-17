from .models import SearchTerms
from modules.cluster.run import run_clustering
from modules.utils.cluster_utils import create_job
from modules.utils.executor_utils import submit

def search(search_terms: SearchTerms ):
    job_id = create_job()
    config = {
        "max_depth": 3,
        "min_points": 5,
        "skip_llm": False,
        "search": True,
        "n_clusters": 3,
        "n_clusters_base": 5,
        "job_id": job_id
    }
    submit(run_clustering, config, search_terms.dict(), job_id)
    return job_id


    