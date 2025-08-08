from typing import List, Dict
from ..utils.database_utils import get_db_connection
from .embed import embed
from .extract import extract_points
from .utils import check_contribution, prepare_prompt, fetch_unanalysed_debates, mark_as_analysed
from .save import save_points

#### MAIN FUNCTION WE WANT TO USE ####

def generate_points(batch_size: int = 10, filters: Dict = {"house": "Commons"}):
    """
    Generates points from debates that have not been analysed yet.
    """
    conn = get_db_connection()
    analysis_pass = 0
    while True:
        debate_list = fetch_unanalysed_debates(conn, batch_size, filters)    

        if not debate_list:
            print(f"analysed {analysis_pass * batch_size} debates")
            conn.close()
            print("All debates processed.")
            break

        print(f"Found {len(debate_list)} unanalysed debates. Processing...")
        process_debates(conn, debate_list)

        analysis_pass +=1


def process_debates(conn, debates: List[Dict]):
    """ Processes each debate to extract contributions and generate points. """
    debate_titles = [debate['title'] for debate in debates]
    debate_ids = [debate['ext_id'] for debate in debates]
    for debate_ext_id, debate_title in zip(debate_ids, debate_titles):
        point_list = process_debate(conn, debate_ext_id, debate_title)
        if point_list:
            save_points(conn, point_list)
        # Mark debate as analysed
        mark_as_analysed(conn, debate_ext_id)
        print(f"Processed debate {debate_ext_id} with {len(point_list)} points extracted.")

def process_debate(conn, debate_ext_id: str, debate_title: str):
    """ Processes a single debate to extract contributions and generate points. """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT item_id, contribution_value, attributed_to, member_id, contribution_type
        FROM contribution
        WHERE debate_ext_id = %s
        ORDER BY order_in_section ASC;
    """, (debate_ext_id,))
    
    result = cursor.fetchall()
    cursor.close()
    print(f"Got contributions for {debate_ext_id}")
    cols = [descr[0] for descr in cursor.description]
    contributions = [dict(zip(cols, row)) for row in result]
    print(f"Processing {len(contributions)} contributions for debate {debate_ext_id}")
    point_list = []
    if not contributions:
        print(f"No contributions found for debate {debate_ext_id}. Skipping.")
        return point_list
    
    # Process each contribution
    for i, contribution in enumerate(contributions):
        past_contribution = contributions[i-1] if i > 0 else None
        if not check_contribution(contribution):
            print(f"Skipping contribution {contribution['item_id']} in debate {debate_ext_id} - {contribution['attributed_to']}: not suitable for LLM analysis")
            continue
        # Prepare the prompt for LLM analysis
        current_prompt = prepare_prompt(debate_title, contribution, past_contribution)
        points = extract_points(current_prompt)
        if points:
            for point in points:
                embedding = embed(point)
                point_list.append((contribution['item_id'], point, embedding))
                    
    print(f"Processed {len(point_list)} points for debate {debate_ext_id}.")
    return point_list


