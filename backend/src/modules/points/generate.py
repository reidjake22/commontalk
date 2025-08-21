from time import time
from typing import List, Dict
from ..utils.database_utils import get_db_connection
from .embed import embed
from .extract import extract_points
from .utils import check_contribution, prepare_prompt, fetch_unanalysed_debates, fetch_debate_analysis_counts, mark_as_analysed
from .save import save_points
import concurrent.futures
import time
#### MAIN FUNCTION WE WANT TO USE ####

def generate_points(batch_size: int = 10, filters: Dict = {"house": "Commons"}):
    """
    Generates points from debates that have not been analysed yet.
    """
    conn = get_db_connection()
    analysis_pass = 0
    # First print the number of unanalysed debates
    counts = fetch_debate_analysis_counts(conn, filters)
    print("Analysed:", counts["analysed"], "Unanalysed:", counts["unanalysed"])
    time.sleep(1)

    while True:
        print(f"Starting analysis pass {analysis_pass + 1} with batch size {batch_size}")
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
    for i, (debate_ext_id, debate_title) in enumerate(zip(debate_ids, debate_titles)):
        print(f"Processing debate {i + 1}/{len(debates)}: {debate_title} (ID: {debate_ext_id})")
        point_list = process_debate(conn, debate_ext_id, debate_title)
        if point_list:
            save_points(conn, point_list)
        # Mark debate as analysed
        mark_as_analysed(conn, debate_ext_id)

def process_debate_sequential(debate_title, contributions):
    point_list = []
    for i, contribution in enumerate(contributions):
        if i % ((len(contributions) // 5) + 1) == 0:
            print(f"Processing contribution {i+1}/{len(contributions)} in debate {debate_title}", flush=True)
        past_contribution = contributions[i-1] if i > 0 else None
        if not check_contribution(contribution):
            continue
        current_prompt = prepare_prompt(debate_title, contribution, past_contribution)
        points = extract_points(current_prompt)
        if points:
            for point in points:
                embedding = embed(point)
                point_list.append((contribution['item_id'], point, embedding))
    return point_list

def process_debate_parallel(debate_title, contributions, max_workers=5):
    def process_chunk(chunk):
        return process_debate_sequential(debate_title, chunk)

    chunk_size = max(1, len(contributions) // max_workers)
    chunks = [contributions[i:i+chunk_size] for i in range(0, len(contributions), chunk_size)]
    point_list = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_chunk, chunk) for chunk in chunks]
        for future in concurrent.futures.as_completed(futures):
            point_list.extend(future.result())
    return point_list

def process_debate(conn, debate_ext_id: str, debate_title: str, parallel_threshold=5):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT item_id, contribution_value, attributed_to, member_id, contribution_type
        FROM contribution
        WHERE debate_ext_id = %s
        ORDER BY order_in_section ASC;
    """, (debate_ext_id,))
    result = cursor.fetchall()
    cursor.close()
    cols = [descr[0] for descr in cursor.description]
    contributions = [dict(zip(cols, row)) for row in result]
    if not contributions:
        print(f"No contributions found for debate {debate_ext_id}. Skipping.")
        return []

    print(f"Processing {len(contributions)} contributions for debate {debate_ext_id}")
    if len(contributions) >= parallel_threshold:
        return process_debate_parallel(debate_title, contributions)
    else:
        return process_debate_sequential(debate_title, contributions)


