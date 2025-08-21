# Imports
from typing import List, Dict
import psycopg2

# Local Imports
from .insert import insert_party, insert_member, insert_debate, insert_contribution

def save_parties(conn: psycopg2.extensions.connection, parties: List[Dict]) -> None:
    """ Saves party data to the PostgreSQL database. """
    for party in parties:
        insert_party(conn, party)

def save_members(conn: psycopg2.extensions.connection, members: List[Dict]) -> None:
    """ Saves member data to the PostgreSQL database. """
    for member in members:
        try:
            insert_member(conn, member)
        except Exception as e1:
            print(f"Error inserting member {member['member_id']}: {e1}")

def save_debates(conn: psycopg2.extensions.connection, debates: List[Dict]) -> None:
    """ Saves debates to the PostgreSQL database. """
    for debate in debates:
        try:
            insert_debate(conn, debate)
            conn.commit()
        except Exception as e:
            print(f"Error inserting debate {debate['ext_id']}: {e}")


def save_contributions(conn: psycopg2.extensions.connection, contributions: List[Dict]) -> None:
    """ Saves contributions to the PostgreSQL database. """
    for contribution in contributions:
        try:
            insert_contribution(conn, contribution)
        except Exception as e:
            print(f"Error inserting contribution {contribution['ext_id']}: {e}")
