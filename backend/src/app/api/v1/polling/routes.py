from flask import Blueprint
from .schemas import PollOut
from ....common.errors import ErrorSchema
from app.services.job_polling.polling import poll_job
from app.services.job_polling.featured_topics import run

bp = Blueprint("polling", __name__)

@bp.get("/featured")
def featured_poll():
    featured_topics = run()
    return featured_topics.model_dump(), 200

@bp.get("/<job_id>")
def poll(job_id: str):
    """Poll for the status of a job."""
    try:
        poll_result = poll_job(job_id)
        print(f"Polling result for job {job_id}: {poll_result}")
        print(PollOut(job_id=job_id, status=poll_result['status'], root_cluster_id=poll_result['root_cluster_id'] if poll_result['root_cluster_id'] else None).model_dump(), 200)
        return PollOut(job_id=job_id, status=poll_result['status'], root_cluster_id=poll_result['root_cluster_id'] if poll_result['root_cluster_id'] else None).model_dump(), 200
    except Exception as e:
        print(e)
        return ErrorSchema(error=str(e)).model_dump(), 500
