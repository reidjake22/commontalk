# Imports:
from typing import List, Dict, Optional
import time

# Local imports:
from ..utils.database_utils import get_db_connection

def extract_debate_overview(debate_data: Dict) -> Dict:
    """ Extracts overview information from debate data. """
    overview = debate_data.get('Overview', {})
    return {
        "ext_id": overview.get('ExtId'),
        "title": overview.get('Title'),
        "date": overview.get('Date'),
        "house": overview.get('House'),
        "location": overview.get('Location'),
        "debate_type_id": overview.get('DebateTypeId'),
        "parent_ext_id": debate_data['Navigator'][-1]['ExternalId'] if 'Navigator' in debate_data and len(debate_data['Navigator']) > 1 else None
    }

def find_most_recent_member_id_and_attribution(debate_data: Dict, contribution_index: int) -> Optional[tuple[str,str]]:
    """ Finds the most recent member ID for a contribution in a debate. """
    
    for i in range(contribution_index, -1, -1):
        contribution = debate_data.get('Items', [])[i]
        if contribution.get('HRSTag') == 'hs_para':
            if contribution.get('MemberId'):
                return contribution.get('MemberId'), contribution.get('AttributedTo')
    return None, None
def extract_contributions(debate_data: Dict) -> List[Dict]:
    """ Extracts contributions from debate data. """
    contributions = []
    for i, contribution in enumerate(debate_data.get('Items', [])):
        contribution_dict = {
            "ext_id" : contribution.get('ExternalId'),
            "item_id": contribution.get('ItemId'),
            "type": contribution.get('ItemType'),
            "debate_section_ext_id": debate_data.get('Overview', {}).get('ExtId'),
            "member_id": contribution.get('MemberId'),
            "attributed_to": contribution.get('AttributedTo'),
            "value": contribution.get('Value'),
            "order_in_section": contribution.get('OrderInSection'),
            "timecode": contribution.get('Timecode'),
            "hrs_tag": contribution.get('HRSTag', None),
        }
        if contribution_dict["hrs_tag"] in ["hs_para", "hs_parafo", "hs_quotefo"] and not contribution_dict["member_id"]:
            member_id, attribution = find_most_recent_member_id_and_attribution(debate_data, i)
            if member_id:
                contribution_dict["member_id"] = member_id
                contribution_dict["attributed_to"] = attribution
        contributions.append(contribution_dict)
    return contributions

def check_if_members_and_parties_exist():
    """ Checks if members and parties data exist in the database. """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM member;")
    member_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM party;")
    party_count = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()

    return member_count > 0 and party_count > 0

def check_date(date_str: str) -> bool:
    """ Checks if the date string is in the format YYYY-MM-DD. """
    try:
        time.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False