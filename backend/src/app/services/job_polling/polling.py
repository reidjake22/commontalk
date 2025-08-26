# backend/src/app/services/job_polling/polling.py
# Imports
import logging

# Project imports
from modules.utils.cluster_utils import get_job_status
from app.common.errors import NotFound, ApiError

logger = logging.getLogger(__name__)
def poll_job(job_id):
    try:
        job_status = get_job_status(job_id)
        if not job_status:
            raise NotFound(f"Job {job_id} not found")
        return job_status

    except Exception as e:
        # Unexpected error: raise as generic API error
        logger.error(f"Unexpected error polling job {job_id}: {e}")
        raise ApiError("polling_error", f"Error polling job {job_id}", status_code=500)
