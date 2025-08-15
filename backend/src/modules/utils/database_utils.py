import psycopg2
from typing import Dict

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="parliament",
        user="parliament_user",
        password="parliament_pass",
        port=5432
    )