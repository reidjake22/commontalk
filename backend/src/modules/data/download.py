# Imports:
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Local imports:
from .utils import check_date, check_if_members_and_parties_exist
from ..utils.database_utils import get_db_connection
from .save import save_parties, save_members, save_debates, save_contributions
from .scrape import scrape_parties, scrape_members, scrape_debates_and_contributions, get_missing_parties

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
    #Lists of dictionaries to insert each dictionary is a data item
    members = scrape_members()
    parties = scrape_parties()
    
    # returns a list of parties 
    missing_parties = get_missing_parties(parties, members)
    
    if missing_parties:
        parties.extend(missing_parties)
    
    # Log the number of members and parties downloaded
    logging.info(f"Downloaded {len(members)} members and {len(parties)} parties.")

    # Save members and parties to the database
    conn = get_db_connection()
    try:
        save_parties(conn, parties)
        conn.commit()
        save_members(conn, members)
        conn.commit()
    except Exception as e:
        print(f"Error saving members or parties: {e}")
    finally:
        conn.close()

def download_debates_and_contributions(start_date, end_date):
    """ Downloads debates and contributions data from the API. """
    debates, contributions = scrape_debates_and_contributions(start_date, end_date)
    # Log the number of debates and contributions downloaded
    logging.info(f"Downloaded {len(debates)} debates and {len(contributions)} contributions.")
    
    # Save debates and contributions to the database
    conn = get_db_connection()
    try:
        save_debates(conn, debates)
        conn.commit()
        save_contributions(conn, contributions)
        conn.commit()
    except Exception as e:
        print(f"Error saving debates or contributions: {e}")
    finally:
        conn.close()