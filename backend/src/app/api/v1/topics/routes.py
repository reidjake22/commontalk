# src/app/api/v1/topics/routes.py
from flask import Blueprint, request, abort, jsonify
from .schemas import SingleTopicOut, FeaturedTopicsOut, ErrorSchema
from app.services.topics.single_topic import run as get_single
from app.services.topics.featured_topics import run as featured_topics
from app.services.topics.paging import get_cluster_points

bp = Blueprint("topics", __name__)

@bp.get("/<topic_id>")
def single_topic(topic_id: str):
    service_result = get_single(topic_id)  # Returns SingleTopicOut from service
    api_obj = SingleTopicOut.model_validate(service_result.model_dump())
    return api_obj.model_dump(), 200

@bp.get("/featured")
def featured():
    service_result = featured_topics()  # Returns list[dict] or list[FeaturedTopicOut]
    dumped_service_result = [item.model_dump() if hasattr(item, 'model_dump') else item for item in service_result]
    # Validate and wrap the list in the response schema
    api_obj = FeaturedTopicsOut.model_validate({"topics": dumped_service_result})
    return api_obj.model_dump(), 200    


@bp.get("/<int:topic_id>/points")
def topic_points(topic_id: int):
    """
    Return paged RichPoints for a topic/cluster.
    Cursors are point_id strings: use ?after_point_id=... (older) or ?before_point_id=... (newer).
    """
    # Parse & clamp params
    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        abort(400, description="limit must be an integer")
    limit = max(1, min(limit, 200))

    after_point_id = request.args.get("after_point_id", type=int)
    before_point_id = request.args.get("before_point_id", type=int)

    if after_point_id and before_point_id:
        abort(400, description="Use either after_point_id or before_point_id, not both.")

    # Call service (returns a Pydantic PagedResponse[RichPointOut])
    page = get_cluster_points(
        cluster_id=topic_id,
        limit=limit,
        after_point_id=after_point_id,
        before_point_id=before_point_id,
    )

    # Ensure cursors are strings in JSON (aligns with your TS types)
    payload = page.model_dump()
    meta = payload.get("meta", {})
    for k in ("next_cursor", "previous_cursor"):
        if meta.get(k) is not None:
            meta[k] = str(meta[k])
    payload["meta"] = meta

    return jsonify(payload), 200