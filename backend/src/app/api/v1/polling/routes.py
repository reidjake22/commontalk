from flask import Blueprint
from spectree import Response
from .schemas import PollOut
from ....common.errors import ErrorSchema
from app.services.job_polling.polling import poll_job
from app import api_spec

bp = Blueprint("polling", __name__)

@bp.post("/<job_id>")
@api_spec.validate(
    resp=Response(HTTP_200={"job_id": str}, HTTP_400=ErrorSchema, HTTP_503=ErrorSchema),
    tags=["polling"],
)
def poll(job_id: str):
    """Poll for the status of a job."""
    try:
        poll_result = poll_job(job_id)
    except Exception as e:
        error_obj = ErrorSchema(message=str(e))
        return error_obj.model_dump(), 400
    return PollOut(job_id=job_id, status=poll_result.status, error=poll_result.error).model_dump(), 200
