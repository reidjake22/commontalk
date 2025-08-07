import re

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
