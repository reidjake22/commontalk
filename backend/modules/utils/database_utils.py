import psycopg2

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="parliament",
        user="parliament_user",
        password="parliament_pass",
        port=5432
    )