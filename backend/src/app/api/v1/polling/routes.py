from flask import Blueprint
from spectree import Response
from .schemas import PollOut
from ....common.errors import ErrorSchema
from app.services.job_polling.polling import poll_job
from app import api_spec

bp = Blueprint("polling", __name__)

@bp.get("/<job_id>")
def poll(job_id: str):
    """Poll for the status of a job."""
    try:
        poll_result = poll_job(job_id)
    except Exception as e:
        error_obj = ErrorSchema(message=str(e))
        return error_obj.model_dump(), 400
    print(f"Polling result for job {job_id}: {poll_result}")
    print(PollOut(job_id=job_id, status=poll_result['status'], root_cluster_id=poll_result['root_cluster_id'] if poll_result['root_cluster_id'] else None, error=poll_result['error']).model_dump(), 200)
    return PollOut(job_id=job_id, status=poll_result['status'], root_cluster_id=poll_result['root_cluster_id'] if poll_result['root_cluster_id'] else None, error=poll_result['error']).model_dump(), 200
