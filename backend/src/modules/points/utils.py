import re
from typing import Dict, List

def clean_llm_response(response: str) -> str:
    """
    Cleans LLM response by removing HTML artifacts and extracting JSON array.
    """
    
    cleaned_response = response
    
    # Remove HTML tags and artifacts
    cleaned_response = re.sub(r'<[^>]*>', '', cleaned_response)
    cleaned_response = re.sub(r'</[^>]*', '', cleaned_response)
    cleaned_response = re.sub(r'<[^>]*', '', cleaned_response)
    
    # Remove specific LLM artifacts
    cleaned_response = re.sub(r'\[/et\]?', '', cleaned_response)
    cleaned_response = re.sub(r'/et\]?', '', cleaned_response)
    cleaned_response = re.sub(r'\[/\w+\]', '', cleaned_response)  # Remove any [/tag] patterns
    
    # Extract JSON array pattern (find first complete array)
    json_match = re.search(r'\[.*?\]', cleaned_response, re.DOTALL)
    if json_match:
        cleaned_response = json_match.group(0)
    
    return cleaned_response.strip()

def check_contribution(contribution)-> bool:
    """ Checks if the contribution is something we want for the LLM to analyse or just a time stamp or something weird - good for formatting, useless for LLM"""
    if contribution['member_id'] is None:
        print(f"Skipping contribution {contribution['item_id']} - no member ID")
        return False
    if contribution['contribution_value'] is None or contribution['contribution_value'].strip() == "":
        print(f"Skipping contribution {contribution['item_id']} - no contribution value")
        return False
    if contribution['attributed_to'] is None or contribution['attributed_to'].strip() == "":
        print(f"Skipping contribution {contribution['item_id']} - no attribution")
        return False
    if contribution['contribution_type'] not in ["Contribution", "Intervention", "Question"]:
        print(f"Skipping contribution {contribution['item_id']} - not a valid contribution type: {contribution['contribution_type']}")
        return False
    return True

def prepare_prompt(debate_title: str, contribution: Dict, past_contribution: Dict = None) -> str:
    """ Prepares the prompt for LLM analysis based on the contribution and past contribution. """
    prior_section = ""
    if past_contribution:
        prior_section = ("## Prior Contribution:\n"
        f"Speaker: {past_contribution['attributed_to']}\n"
        f"{past_contribution['contribution_value']}")
    current_prompt = (f"# Debate Name: {debate_title}\n"
    f"{prior_section}\n"
    "## Target Contribution: \n"
    f"Speaker: {contribution['attributed_to']}\n"
    f"{contribution['contribution_value']}\n")
    return current_prompt

def fetch_unanalysed_debates(conn, batch_size, filters: Dict = {"house": "Commons"}) -> List[Dict]:
    """ Fetches debates that have not been analysed and have contributions with member_id. """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ext_id, title
        FROM debate
        WHERE analysed IS FALSE
        AND house = %s
        AND EXISTS (
            SELECT 1
            FROM contribution
            WHERE debate_ext_id = debate.ext_id AND member_id IS NOT NULL
        )
        ORDER BY ext_id
        LIMIT %s;
    """, (filters.get("house", "Commons"), batch_size))
    
    results = cursor.fetchall()
    cursor.close()
    return [{"ext_id": row[0], "title": row[1]} for row in results]

def mark_as_analysed(conn, debate_ext_id: str):
    """ Marks a debate as analysed in the database. """
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE debate
        SET analysed = TRUE
        WHERE ext_id = %s;
    """, (debate_ext_id,))
    cursor.close()
    conn.commit()
    print(f"Debate {debate_ext_id} marked as analysed.")