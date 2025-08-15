# src/app/api/v1/topics/routes.py
from flask import Blueprint
from spectree import Response
from app import api_spec
from .schemas import SingleTopicOut, FeaturedTopicsOut, ErrorSchema
from app.services.topics.single_topic import run as get_single
from app.services.topics.featured_topics import run as featured_topics

bp = Blueprint("topics", __name__)

@bp.get("/<topic_id>")
@api_spec.validate(
    resp=Response(HTTP_200=SingleTopicOut, HTTP_404=ErrorSchema, HTTP_503=ErrorSchema),
    tags=["topics"],
)
def single_topic(topic_id: str):
    service_result = get_single(topic_id)  # Returns SingleTopicOut from service
    api_obj = SingleTopicOut.model_validate(service_result.model_dump())
    return api_obj.model_dump(), 200

@bp.get("/featured")
@api_spec.validate(
    resp=Response(HTTP_200=FeaturedTopicsOut, HTTP_404=ErrorSchema, HTTP_503=ErrorSchema),
    tags=["topics"],
)
def featured():
    service_result = featured_topics()  # Returns list[dict] or list[FeaturedTopicOut]
    dumped_service_result = [item.model_dump() if hasattr(item, 'model_dump') else item for item in service_result]
    # Validate and wrap the list in the response schema
    api_obj = FeaturedTopicsOut.model_validate({"topics": dumped_service_result})
    return api_obj.model_dump(), 200    