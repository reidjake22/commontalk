# backend/src/app/api/v1/polling/routes.py

# Imports
from flask import Blueprint
import logging
from pydantic import ValidationError

# Project imports
from .schemas import PollOut
from ....common.errors import ServerError
from app.services.job_polling.polling import poll_job
from app.services.job_polling.featured_topics import run

logger = logging.getLogger(__name__)
bp = Blueprint("polling", __name__)

@bp.get("/featured")
def featured_poll():
    featured_topics = run()
    return featured_topics.model_dump(), 200

@bp.get("/<job_id>")
def poll(job_id: str):
    """Poll for the status of a job."""
    poll_result = poll_job(job_id)
    try:
        return PollOut(
            job_id=job_id,
            status=poll_result['status'],
            root_cluster_id=poll_result['root_cluster_id'] if poll_result['root_cluster_id'] else None
        ).model_dump(), 200
    except ValidationError as e:
        logger.error(f"Schema validation error polling job {job_id}: {e}")
        raise ServerError("schema_validation_error", "Invalid response schema for polling job", str(e))