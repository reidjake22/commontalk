import psycopg2
from dotenv import load_dotenv
import os


# Always resolve path relative to this file
dotenv_path = os.path.join(os.path.dirname(__file__), '../../../.env')
load_dotenv(dotenv_path)
dsn = os.environ["DB_URL"]
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