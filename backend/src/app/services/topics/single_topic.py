# backend/src/app/services/topics/single_topic.py
from modules.utils.database_utils import get_db_connection
from modules.utils.cluster_utils import get_cluster_by_id
from .mappers import map_cluster_to_single_topic  # returns a dict/DTO suitable for API
from .models import SingleTopic

import logging
from typing import Dict
from app.common.errors import NotFound, ServiceUnavailable

logger = logging.getLogger(__name__)

def run(topic_id:str)-> SingleTopic:
    """ Retrieves a single topic by its ID, including points and metadata."""
    logger.info(f"Retrieving single topic with ID: {topic_id}")
    conn = get_db_connection()
    try:
        single_cluster = get_cluster_by_id(conn, topic_id, include_points=True, include_metadata=True)
        single_topic = map_cluster_to_single_topic(single_cluster)
        return single_topic
    except Exception as e:
        logger.error(f"Error retrieving single topic with ID {topic_id}: {e}")
        raise ServiceUnavailable(f"Could not retrieve topic with ID {topic_id}") from e
    finally:
        conn.close()
