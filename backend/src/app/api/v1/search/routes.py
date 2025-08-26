# backend/src/app/api/v1/search/routes.py

# Imports
from flask import Blueprint, request, jsonify

# Project imports
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
    search_submit_result = post_search(search_terms)
    return jsonify(JobNotification(job_id=search_submit_result, status="queued").model_dump()), 200