from modules.utils.cluster_utils import get_job_status

def poll_job(job_id):
    job_status = get_job_status(job_id)
    return job_status
