

from app.services.topics.models import FeaturedTopic
from modules.utils.cluster_utils import get_root_cluster_by_job_id, get_cluster_by_id
from app.services.topics.mappers import map_cluster_to_featured_topics
from modules.models.cluster import ClusterData

def get_featured_topic_by_job_id(job_id)-> FeaturedTopic:
    root_cluster_id = get_root_cluster_by_job_id(job_id)

    # Fetch the featured topic using the root_cluster_id
    root_cluster = get_cluster_by_id(root_cluster_id)

    featured_topics = map_cluster_to_featured_topics(root_cluster)
    return featured_topics