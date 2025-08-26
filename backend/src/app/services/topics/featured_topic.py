from app.services.topics.models import FeaturedTopic
from modules.utils.cluster_utils import get_root_cluster_by_job_id, get_cluster_by_id
from app.services.topics.mappers import map_cluster_to_featured_topics
from modules.models.cluster import ClusterData
from modules.utils.database_utils import get_db_connection
from app.common.errors import ApiError, ServerError
import logging

logger = logging.getLogger(__name__)

def get_featured_topics_by_job_id(job_id) -> FeaturedTopic:
    try:
        conn = get_db_connection()
        root_cluster_id = get_root_cluster_by_job_id(conn, job_id)
        root_cluster = get_cluster_by_id(conn, root_cluster_id, include_points=False, include_metadata=False)
        featured_topics = map_cluster_to_featured_topics(root_cluster)
        return featured_topics
    except ApiError as e:
        logger.error(f"API error fetching featured topics for job {job_id}: {e}", exc_info=True)
        raise  # propagate the original ApiError (preserves status/message)
    except Exception as e:
        logger.error(f"Unexpected error fetching featured topics for job {job_id}: {e}", exc_info=True)
        raise ServerError("featured_topic_error", "An error occurred while fetching featured topics.")