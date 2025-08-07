# Imports:
import logging

# Local imports:
from .utils import get_missing_parties, check_date, check_if_members_and_parties_exist
from ..utils.database_utils import get_db_connection
from .save import save_parties, save_members, save_debates, save_contributions
from .scrape import scrape_parties, scrape_members, scrape_debates_and_contributions

### MAIN FUNCTION YOU WANT TO USE ###

def download_data(start_date: str, end_date: str):
    """ Downloads data for the specified date range. """
    if not (check_date(start_date) and check_date(end_date)):
        logging.error("Invalid date format. Please use YYYY-MM-DD.")
        raise ValueError("Invalid date format. Please use YYYY-MM-DD.")
    if not check_if_members_and_parties_exist():
        logging.info("Members and parties data not found in the database. Downloading...")
        download_members_and_parties()
    else:
        logging.info("Members and parties data already exist in the database. Skipping download.")

    download_debates_and_contributions(start_date, end_date)
    logging.info("Debates and contributions data downloaded successfully.")



def download_members_and_parties():
    """ Downloads members and parties data from the API. """
    members = scrape_members()
    parties = scrape_parties()
    
    missing_parties = get_missing_parties(parties, members)
    if missing_parties:
        parties.extend(missing_parties)
        
    # Log the number of members and parties downloaded
    logging.info(f"Downloaded {len(members)} members and {len(parties)} parties.")

    # Save members and parties to the database
    conn = get_db_connection()
    try:
        save_parties(conn, parties)
        save_members(conn, members)
    except Exception as e:
        logging.error(f"Error saving members or parties: {e}")
    finally:
        conn.close()

def download_debates_and_contributions():
    """ Downloads debates and contributions data from the API. """
    debates, contributions = scrape_debates_and_contributions()
    # Log the number of debates and contributions downloaded
    logging.info(f"Downloaded {len(debates)} debates and {len(contributions)} contributions.")
    
    # Save debates and contributions to the database
    conn = get_db_connection()
    try:
        save_debates(conn, debates)
        save_contributions(conn, contributions)
    except Exception as e:
        logging.error(f"Error saving debates or contributions: {e}")
    finally:
        conn.close()

