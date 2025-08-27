from time import time
from typing import List, Dict, Tuple
from ..utils.database_utils import get_db_connection
from .embed import embed
from .extract import extract_points
from .utils import check_contribution, prepare_prompt, fetch_unanalysed_debates, fetch_debate_analysis_counts, mark_as_analysed
from .save import save_points
import concurrent.futures
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#### MAIN FUNCTION WE WANT TO USE ####
def generate_points(filters: Dict = {"house": "Commons"}):
    conn = get_db_connection()
    counts = fetch_debate_analysis_counts(conn, filters)
    print("Analysed:", counts["analysed"], "Unanalysed:", counts["unanalysed"])
    time.sleep(1)
    conn.close()
    total_processed = 0
    while True:
        conn = get_db_connection()
        debate_list = fetch_unanalysed_debates(conn, 1000, filters)
        conn.close()
        if not debate_list:
            print(f"analysed {total_processed} debates")
            print("All debates processed.")
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(process_debate, d['title'], d['ext_id']) for d in debate_list]
            for future in concurrent.futures.as_completed(futures):
                ok, msg = future.result()
                if ok:
                    total_processed += 1
                    logger.info(f"{counts['unanalysed'] - total_processed}/{counts['unanalysed']} debates left to analyse")

def process_debate(debate_title,debate_ext_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT item_id, contribution_value, attributed_to, member_id, contribution_type
            FROM contribution
            WHERE debate_ext_id = %s
            ORDER BY order_in_section ASC;
        """, (debate_ext_id,))
        result = cursor.fetchall()
        cols = [descr[0] for descr in cursor.description]
        cursor.close()
        contributions = [dict(zip(cols, row)) for row in result]
        if not contributions:
            return True, f"Skipped debate {debate_ext_id} - no contributions"
        point_list = process_contributions(debate_title, contributions)

        save_points(conn, point_list)
        mark_as_analysed(conn, debate_ext_id)
        return True, f"Processed debate {debate_ext_id}, {len(point_list)} points generated"
    except Exception as e:
        logger.error(f"Error processing debate {debate_ext_id}: {e}")
        return False, f"Error processing debate {debate_ext_id}: {e}"
    finally:
        conn.close()

def process_contributions(debate_title,contributions: List[Dict]) -> List[Tuple[int, str, List[float]]]:
    point_list = []
    n = len(contributions)
    for i, c in enumerate(contributions):
        if not check_contribution(c):
            continue
        prompt = prepare_prompt(debate_title, c)
        points = extract_points(prompt)
        for p in points:
            emb = embed(p)  # swap to a batch embed later if you add one
            point_list.append((c["item_id"], p, emb))
    return point_list
