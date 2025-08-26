# backend/src/app/services/topics/featured_topics.py

# Project imports
from modules.utils.database_utils import get_db_connection
from modules.utils.cluster_utils import create_job, get_job_status_by_setup
from modules.utils.executor_utils import submit
from modules.cluster.run import run_clustering
from datetime import datetime, timedelta
from ...common.models import JobNotification
from app.common.errors import ErrorSchema


def run(target_date="2025-07-16") -> JobNotification:
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
        job_status = get_job_status_by_setup(conn, config=config, filters=filters)
        job_id = job_status["job_id"]
        job_status = job_status["status"]
        if not job_id:
            print("No job found, running clustering")
            job_id = submit_cluster_run(filters=filters, config=config)
        return JobNotification(job_id=job_id, status=job_status)

    except Exception as e:
        print(e)
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

