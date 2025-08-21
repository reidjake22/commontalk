from typing import Dict, List
from groq import Groq
import os

def summarise_cluster(cluster_points: List, title: str) -> str:
    """Summarises a cluster of points based on their values and title using LLM"""
    if not cluster_points:
        return "Empty cluster"
    
    # Extract point values (assuming point[1] is the text content)
    point_texts = [str(point["text"]) for point in cluster_points[:20]]  # Limit to 20 for API

    model_input = f"""The following points are all part of the same category - {title}. 
    Using the additional context of the points themselves, please provide a 200-word summary 
    of the arguments, points and concerns revealed in these points:
    
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

def title_cluster(cluster_points: List) -> str:
    """Labels a cluster of points based on their values using LLM"""
    if not cluster_points:
        return "Empty Cluster"
    
    # Extract point values (assuming point[1] is the text content)
    point_texts = [str(point["text"]) for point in cluster_points[:15]]  # Limit to 5 for API
    
    model_input = f"""The following points are all part of the same category. 
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
