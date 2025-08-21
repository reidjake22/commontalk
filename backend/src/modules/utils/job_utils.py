from .database_utils import get_db_connection
import logging

def clear_jobs_on_startup():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cluster_jobs WHERE status = 'queued' OR status = 'in_progress'")
        conn.commit()
        logging.info("Cleared queued and in-progress jobs on startup.")
    except Exception as e:
        logging.error(f"Error clearing jobs on startup: {e}")
    finally:
        cursor.close()
        conn.close()