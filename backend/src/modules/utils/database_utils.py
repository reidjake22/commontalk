import psycopg2
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
# Always resolve path relative to this file
dotenv_path = os.path.join(os.path.dirname(__file__), '../../../.env')
load_dotenv(dotenv_path)
dsn = os.environ.get("DB_URL")
if not dsn: # Assumes local db if no env variable set
    logger.warning("No DB_URL found in environment variables. Using default local database configuration.")
    dsn = "dbname=parliament user=parliament_user password=parliament_pass host=localhost port=5432"

def get_db_connection():

    conn = psycopg2.connect(
        dsn,
        connect_timeout=10,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )
    return conn