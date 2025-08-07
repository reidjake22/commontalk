from typing import List, Dict

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

def process_debates(conn, debates: List[Dict]):
    """ Processes each debate to extract contributions and generate points. """
    debate_titles = [debate['title'] for debate in debates]
    debate_ids = [debate['ext_id'] for debate in debates]
    for debate_ext_id, debate_title in zip(debate_ids, debate_titles):
        point_list = process_debate(conn, debate_ext_id, debate_title)
    
        if point_list:
            for item_id, point, embedding in point_list:
                save_point(item_id, point, embedding)
        # Mark debate as analysed
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE debate
            SET analysed = TRUE
            WHERE ext_id = %s;
        """, (debate_ext_id,))
        cursor.close()
        conn.commit()
        print(f"Processed debate {debate_ext_id} with {len(point_list)} points extracted.")


def process_debate(conn, debate_ext_id: str, debate_title: str):



def generate_points(debate_ids: List[str], start_date: str, end_date: str):
    """ Generates points for debates within a specified date range. """
    BATCH_DEBATES = 10
    print("getting connection")
    conn = get_db_connection()
    print('got connection')
    while True:
        results = fetch_unanalysed_debates(conn, BATCH_DEBATES)
        if not results:
            print("No more debates to process.")
            break
        print(f"Found {len(debate_ids)} debates to process.")
        process_debates(conn, results)

for debate_ext_id, debate_title in zip(debates, debate_titles):
    if stop == 1:
        break
    # Sort by order in section
    cursor.execute("""
        SELECT item_id, contribution_value, attributed_to, member_id, contribution_type
        FROM contribution
        WHERE debate_ext_id = %s
        ORDER BY order_in_section asc;
    """, (debate_ext_id,))
    contributions = cursor.fetchall()
    print(f"got contributions for {debate_ext_id}")
    cols = [descr[0] for descr in cursor.description]
    rows = [dict(zip(cols, row)) for row in contributions]
    print(f"sorted sortign")
    debate_data.append((debate_ext_id, rows))
    print(debate_data)
for debate_ext_id, rows in debate_data:
    entire_token_cost = [0]
    point_list = []
    for i,contribution in enumerate(rows):
        past_contribution = rows[i-1] if i > 0 else None
        contrib_type = contribution['contribution_type']
        is_contribution = check_contribution(contribution)
        if not is_contribution:
            print(f"Skipping contribution {contribution['item_id']} in debate {debate_ext_id} - {contribution['attributed_to']}: not suitable for LLM analysis")
            continue
        # Process the contribution
        prior_section = ""
        if past_contribution:
            prior_section = f"""## Prior Contribution:
            Speaker: {past_contribution['attributed_to']}  

            {past_contribution['contribution_value']}
            """
        current_prompt = f"""# Debate Name: {debate_title}\n
        {prior_section}\n ## Target Contribution: \n
        Speaker: {contribution['attributed_to']}  
        \n\n
        {contribution['contribution_value']}
        """
        points = extract_points(current_prompt, entire_token_cost)
        print(f"Points for {contribution['attributed_to']}: {points}")
        if points:
            for point in points:
                embedding = get_embedding(point)
                point_list.append((contribution['item_id'], point, embedding))
    print("entire token cost:", entire_token_cost[0])
    # Save points to the database
    if point_list:
        for item_id, point, embedding in point_list:
            save_point_to_db(item_id, point, embedding)
    # Mark debate as analysed
    cursor.execute("""
        UPDATE debate
        SET analysed = TRUE
        WHERE ext_id = %s;
    """, (debate_ext_id,))
    conn.commit()
    print(f"Processed debate {debate_ext_id} with {len(point_list)} points extracted.")

cursor.close()
conn.close()
print("All debates processed and saved to the database.")
