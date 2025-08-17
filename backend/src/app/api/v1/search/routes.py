from flask import Blueprint
from spectree import Response
from ....common.models import JobNotification
from ....common.errors import ErrorSchema
from app.services.search.search import post_search
from app import api_spec

bp = Blueprint("search", __name__)

@bp.post("/search")
@api_spec.validate(
    resp=Response(HTTP_200={"job_id": str}, HTTP_400=ErrorSchema, HTTP_503=ErrorSchema),
    tags=["search"],
)
def search(search_terms: dict):
    """Search for topics based on search terms."""
    try:
        search_submit_result= post_search(search_terms)
    except Exception as e:
        error_obj = ErrorSchema(message=str(e))
        return error_obj.model_dump(), 400
    return JobNotification(job_id=search_submit_result).model_dump(), 200