# Imports
from typing import Dict

def insert_party(conn, party_data: Dict) -> None:
    """ Inserts party data into the database. """
    cursor = conn.cursor()
    insert_sql = """
                INSERT INTO party (party_id, name, abbreviation, background_colour, foreground_colour, is_lords_main_party, is_lords_spiritual_party, government_type, is_independent_party)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (party_id) DO NOTHING;
                """
    cursor.execute(insert_sql, (
        party_data['party_id'],
        party_data['name'],
        party_data['abbreviation'],
        party_data['backgroundColour'],
        party_data['foregroundColour'],
        party_data['isLordsMainParty'],
        party_data['isLordsSpiritualParty'],
        party_data['governmentType'],
        party_data['isIndependentParty']
    ))
    cursor.close()


def insert_member(conn, member_data: Dict) -> None:
    """ Inserts member data into the database. """
    cursor = conn.cursor()
    insert_sql = """
                INSERT INTO member (member_id, name_list_as, name_display_as, name_full_title, name_address_as, latest_party_membership, latest_house_membership_id, thumbnail_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (member_id) DO NOTHING;
                """
    cursor.execute(insert_sql, (
        member_data['member_id'],
        member_data['nameListAs'],
        member_data['nameDisplayAs'],
        member_data['nameFullTitle'],
        member_data['nameAddressAs'],
        member_data['latestParty'],
        member_data['latestHouseMembership'],
        member_data['thumbnailUrl']
    ))
    cursor.close()


def insert_debate(conn, debate_data: Dict) -> None:
    """ Inserts debates into the database. """
    cursor = conn.cursor()
    insert_sql = """
                INSERT INTO debate (ext_id, title, date, house, location, debate_type_id, parent_ext_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ext_id) DO NOTHING;
                """
    cursor.execute(insert_sql, (
        debate_data['ext_id'],
        debate_data['title'],
        debate_data['date'],
        debate_data['house'],
        debate_data['location'],
        debate_data['debate_type_id'],
        debate_data['parent_ext_id']
    ))
    cursor.close()

def insert_contribution(conn, contribution_data: Dict) -> None:
    cursor = conn.cursor()
    insert_sql = """
                    INSERT INTO contribution (ext_id, item_id, contribution_type, debate_ext_id, member_id, attributed_to, contribution_value, order_in_section, timecode, hrs_tag)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (item_id) DO NOTHING;
                """
    cursor.execute(insert_sql, (
        contribution_data['ext_id'],
        contribution_data['item_id'],
        contribution_data['type'],
        contribution_data['debate_section_ext_id'],
        contribution_data['member_id'],
        contribution_data['attributed_to'],
        contribution_data['value'],
        contribution_data['order_in_section'],
        contribution_data['timecode'],
        contribution_data['hrs_tag']
    ))
    cursor.close()