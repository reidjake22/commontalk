from app.services.topics.models import FeaturedTopic
from modules.utils.cluster_utils import get_root_cluster_by_job_id, get_cluster_by_id
from app.services.topics.mappers import map_cluster_to_featured_topics
from modules.models.cluster import ClusterData
from modules.utils.database_utils import get_db_connection
import traceback
def get_featured_topics_by_job_id(job_id)-> FeaturedTopic:
    try:
        conn = get_db_connection()
        
        root_cluster_id = get_root_cluster_by_job_id(conn, job_id)
        print(f"ROOT CLUSTER ID: {root_cluster_id}")
        # Fetch the featured topic using the root_cluster_id
        root_cluster = get_cluster_by_id(conn,root_cluster_id, include_points=False, include_metadata=False)
        print(type(root_cluster))
        featured_topics = map_cluster_to_featured_topics(root_cluster)
        
        return featured_topics
    except Exception as e:
        print(f"Error fetching featured topics for job {job_id}: {str(e)}")
        print("Detailed error:")
        traceback.print_exc()
        raise Exception(f"Error fetching featured topics for job {job_id}: {str(e)}")