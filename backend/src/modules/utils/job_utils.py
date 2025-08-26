from .database_utils import get_db_connection
import logging

logger = logging.getLogger(__name__)

def clear_jobs_on_startup():
    sql = """
    DELETE FROM cluster_jobs
    WHERE status IN ('queued','in_progress','running','aborted');
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(sql)
            logger.info("Cleared jobs (and cascaded clusters) on startup. rows=%s", cur.rowcount)
    except Exception as e:
        logger.error("Error clearing jobs on startup: %s", e)
