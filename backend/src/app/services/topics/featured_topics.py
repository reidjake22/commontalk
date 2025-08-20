# backend/src/app/services/topics/featured_topics.py
from modules.utils.database_utils import get_db_connection
from modules.utils.cluster_utils import get_cluster_by_id, get_cluster_by_setup, check_if_cluster_exists, create_job
from modules.utils.executor_utils import submit
from modules.cluster.run import run_clustering
from datetime import datetime, timedelta
from .models import FeaturedTopic
from ...common.models import JobNotification
from .mappers import map_cluster_to_featured_topics
from app.common.errors import ErrorSchema
from typing import List, Dict, Union



def run(target_date="2025-07-16") -> Union[List[FeaturedTopic], JobNotification]:
    conn = get_db_connection()
    try:
        conn = get_db_connection()
    except Exception as e:
        raise RuntimeError(f"Failed to connect to the database: {e}")
    if target_date:
        try:
            end_date = datetime.strptime(target_date, '%Y-%m-%d')
        except ValueError:
            raise ValueError(f"Invalid date format for target_date: {target_date}. Expected YYYY-MM-DD.")
    else:
        end_date = datetime.now()
    
    start_date = end_date - timedelta(days=60)

    filters = {
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d')
    }
    config = {"method": "kmeans", "skip_llm": False, "max_depth": 2, "min_points": 3, "n_clusters": 3, "n_clusters_base": 5}

    try:
        exists = check_if_cluster_exists(conn, config=config, filters=filters)
        if exists:
            print("Cluster already exists, retrieving from database")
            cluster = get_cluster_by_setup(conn, config=config, filters=filters, include_points=False, include_metadata=True)
            print("Cluster retrieved successfully")
            featured_topic = map_cluster_to_featured_topics(cluster)
            print("Featured topics mapped successfully")
        else:
            print("Cluster does not exist, running clustering")
            job_id = submit_cluster_run(filters=filters, config=config)
            return JobNotification(job_id=job_id)
        print("Featured topics run successfully")
        return featured_topic
    except Exception as e:
        error_obj = ErrorSchema(message=str(e))
        print(f"Error during featured topics run: {e}")
        return error_obj
        

    finally:
        conn.close()

def submit_cluster_run(filters, config,):
    config["search"] = False
    params = {
        "filters": filters,
        "config": config
    }
    job_id = create_job(params)
    config["job_id"] = job_id
    
    submit(run_clustering, config, filters)
    return job_id

