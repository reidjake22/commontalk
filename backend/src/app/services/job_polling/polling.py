from modules.utils.cluster_utils import get_job_status

def poll_job(job_id):
    try:
        job_status = get_job_status(job_id)
        print(f"job_status: {job_status}")
        return job_status
    except Exception as e:
        print(f"Error polling job {job_id}: {e}")
        return {"job_id": job_id, "status": "error", "root_cluster_id": None}
