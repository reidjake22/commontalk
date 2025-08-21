from flask import Blueprint, request, jsonify
from ....common.models import JobNotification
from ....common.errors import ErrorSchema
from app.services.search.search import search as post_search

bp = Blueprint("search", __name__)

@bp.post("/")
def search():
    """Search for topics based on search terms."""
    if request.method == "OPTIONS":
        return ("", 204)
    search_terms = request.get_json(force=True)
    try:
        search_submit_result= post_search(search_terms)
    except Exception as e:
        print(f"Error during search submission: {e}")
        print(f"in file: {__file__}")
        error_obj = ErrorSchema(message=str(e))
        return error_obj.model_dump(), 400
    print("Search job submitted with ID:", search_submit_result)
    print("Returning job notification:", JobNotification(job_id=search_submit_result, status="queued").model_dump())
    return jsonify(JobNotification(job_id=search_submit_result, status="queued").model_dump()), 200