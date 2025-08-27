from typing import Dict, List
from groq import Groq
import os
import random

def summarise_cluster(cluster_points: List, title: str) -> str:
    """Summarises a cluster of points based on their values and title using LLM"""
    if not cluster_points:
        return "Empty cluster"
    
    # Extract point values (assuming point[1] is the text content)
    point_texts = [str(point["text"]) for point in cluster_points[:30]]  # Limit to 30 for API

    model_input = f"""Topic: {title}
    We’ve collected a bunch of related points on this issue. Your job is to distill them into a clear summary (about 100-120 words):
    - Highlight the main arguments and any contrasting positions.
    - Note recurring concerns or themes.
    - Keep it balanced and informative, as if summarizing a live debate for someone curious but short on time.
    Tone: Accessible, thoughtful, not academic.
    Here are the points:
    {' | '.join(point_texts)}"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": model_input}],
            temperature=0.0,
            top_p=0.9,
            max_tokens=300
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating cluster summary: {e}")
        return f"Cluster about {title} with {len(cluster_points)} points"

def title_cluster(cluster_points: List, parent_title: str) -> str:
    """Labels a cluster of points based on their values using LLM"""
    if not cluster_points:
        return "Empty Cluster"
    
    # Extract point values (assuming point[1] is the text content)
    point_texts = [str(point["text"]) for point in cluster_points[:30]]  # Limit to 30 for API

    model_input = f"""The following points are all part of the same category. {'They are a subtopic of: ' + parent_title if parent_title else ''} 
    Identify what that category is: {' | '.join(point_texts)}. 
    Please only return a single phrase (2-4 words) that describes the category."""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": model_input}],
            temperature=0.0,
            top_p=0.9,
            max_tokens=50
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating cluster title: {e}")
        return f"Cluster {len(cluster_points)} points"

from typing import List, Sequence

def fetch_text_samples(conn, ids: Sequence[int], sample_size: int = 20) -> List[str]:
    if not ids:
        return []
    # Randomly sample IDs for better representation
    sample_ids = random.sample(ids, min(sample_size, len(ids)))
    with conn.cursor() as cur:
        cur.execute("""
            SELECT p.point_value
            FROM point p
            WHERE p.point_id = ANY(%s)
            LIMIT %s
        """, (list(sample_ids), sample_size))
        return [row[0] for row in cur.fetchall()]