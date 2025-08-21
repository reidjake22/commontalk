
# Imports
import requests
import time
from typing import List, Dict, Optional
import logging

# Local imports:
from .utils import extract_debate_overview, extract_contributions, find_most_recent_member_id_and_attribution

# URLS:
BASE_URL = "https://hansard-api.parliament.uk/"
DEBATE_URL = BASE_URL + "debates/"
SEARCH_URL = BASE_URL + "search/"
MEMBERS_URL = "https://members-api.parliament.uk/api/"



def scrape_parties() -> List[Dict]:
    """ Scrapes party data. """

    party_data = []

    for house in range(1, 3):  # Loop through both houses
        response = requests.get(MEMBERS_URL + "parties/getActive/" + str(house))
        response_data = response.json()
        for party in response_data['items']:
            values = party.get('value', {})
            party_data.append({
                "party_id": values.get('id'),
                "name": values.get('name'),
                "abbreviation": values.get('abbreviation'),
                "backgroundColour": values.get('backgroundColour'),
                "foregroundColour": values.get('foregroundColour'),
                "isLordsMainParty": values.get('isLordsMainParty', False),
                "isLordsSpiritualParty": values.get('isLordsSpiritualParty', False),
                "governmentType": values.get('governmentType'),
                "isIndependentParty": values.get('isIndependentParty', False)
            })
        time.sleep(0.05)
    return party_data

def scrape_members() -> List[Dict]:
    """ Scrapes member data. """
    search_params = {
        'skip': 0,
        'take': 20,
    }
    member_data = []
    while True:
        if search_params['skip'] % 1000 == 0: print(f"Fetching members with skip={search_params['skip']}")
        response = requests.get(MEMBERS_URL + "Members/Search", params=search_params)
        response_data = response.json()
        if not response_data['items']:
          break
        for member in response_data['items']:
            values = member.get('value', {})
            member_data.append({
                'member_id': values.get('id'),
                'nameListAs': values.get('nameListAs'),
                'nameDisplayAs': values.get('nameDisplayAs'),
                'nameFullTitle': values.get('nameFullTitle'),
                'nameAddressAs': values.get('nameAddressAs'),
                'latestParty': values['latestParty'].get('id', None) if values.get('latestParty') else None, # Because sometimes no latest party
                'latestHouseMembership': values.get('latestHouseMembership', {}).get('membershipFromId', None),
                'thumbnailUrl': values.get('thumbnailUrl', None),
            })
        search_params['skip'] += search_params['take']
        time.sleep(0.05)
    return member_data

def scrape_debates_and_contributions(start_date:str, end_date: str) -> tuple[List[Dict], List[Dict]]:
    """ Scrapes debates and their contributions. """
    debate_ids = scrape_debate_ids(start_date, end_date)
    remaining_debate_ids = get_debates_not_added(debate_ids, start_date, end_date)
    print(f"Found {len(debate_ids)} debates.")
    print(f"Found {len(remaining_debate_ids)} left to scrape")
    
    debates_data = []
    contributions_data = []

    for i, debate_ext_id in enumerate(remaining_debate_ids):
        if i % 50 == 0: print(f"Processing debate {i + 1}/{len(debate_ids)}: {debate_ext_id}")
        debate_data = scrape_debate_data(debate_ext_id)

        if debate_data:
            debates_data.append(extract_debate_overview(debate_data))
            contributions_data.extend(extract_contributions(debate_data))
        
        time.sleep(0.05)  # Rate limiting server side
    
    return debates_data, contributions_data

def scrape_debate_ids(start_date: str, end_date: str) -> List[str]:
    """ Scrapes debate external IDs within a date range. """
    search_params = {
        'startDate': start_date,
        'endDate': end_date,
        'take': 100,
        'skip': 0,
    }
    debate_ext_ids = []
    
    while True:
        response = requests.get(SEARCH_URL + "debates.json", params=search_params)
        response_data = response.json()
        if not response_data['Results']:
            break
        for debate in response_data['Results']:
            debate_ext_ids.append(debate['DebateSectionExtId'])
        
        search_params['skip'] += search_params['take']
        time.sleep(0.05)
    return debate_ext_ids

def scrape_debate_data(debate_ext_id: str) -> Optional[Dict]:
    """ Fetches detailed data for a specific debate by its external ID. """
    response = requests.get(DEBATE_URL + "debate/" + debate_ext_id + ".json")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching data for {debate_ext_id}: {response.status_code}")
        return None
    
def scrape_party(party_id: str) -> Optional[Dict]:
    response = requests.get(MEMBERS_URL + f"Members/Search?PartyId={party_id}&skip=0&take=1")
    if response.status_code == 200:
        member_data = response.json()
        first_member = member_data['items'][0]['value'] if member_data['items'] else None
        if first_member:
            party_info = first_member.get('latestParty', {})
            if party_info:
                return {
                    "party_id": party_info.get('id'),
                    "name": party_info.get('name'),
                    "abbreviation": party_info.get('abbreviation'),
                    "backgroundColour": party_info.get('backgroundColour'),
                    "foregroundColour": party_info.get('foregroundColour'),
                    "isLordsMainParty": party_info.get('isLordsMainParty', False),
                    "isLordsSpiritualParty": party_info.get('isLordsSpiritualParty', False),
                    "governmentType": party_info.get('governmentType'),
                    "isIndependentParty": party_info.get('isIndependentParty', False)
                }
            else:
                logging.warning(f"No party info found for party ID {party_id}")
                return None
        else:
            logging.warning(f"No members found for party {party_id}")
            return None
    else:
        logging.error(f"Error fetching party data for {party_id}: {response.status_code}")
        return None

def get_missing_parties(party_data: List[Dict], member_data: List[Dict]) -> List[Dict]:
    """ Returns a list of parties that are missing from the party data but are referenced in member data. """
    party_ids = {party['party_id'] for party in party_data}
    
    member_party_ids = {member['latestParty'] for member in member_data if member.get('latestParty')}
    
    # Find missing party IDs using set difference
    missing_party_ids = member_party_ids - party_ids
    
    # Return list of missing party dictionaries
    missing_parties = []
    for missing_party_id in missing_party_ids:
        missing_party = scrape_party(missing_party_id)
        if missing_party:
            missing_parties.append(missing_party)

    return missing_parties

def get_debates_not_added(debate_ids: List[str], start_date: str, end_date: str) -> List[str]:
    """ Returns a list of debate IDs that are not already in the database. """
    from modules.utils.database_utils import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ext_id FROM debate WHERE date >= %s AND date <= %s;
    """, (start_date, end_date))
    existing_debate_ids = {row[0] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return list(set(debate_ids) - existing_debate_ids)