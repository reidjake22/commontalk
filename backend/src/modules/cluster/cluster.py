from groq import Groq
from typing import Dict, List
from sklearn.cluster import KMeans

cluster_filter = {
    "house": "Commons",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31"
}

def label_cluster(debate_list: List[Dict]) -> str:
    """
    Labels a cluster based on the debates it contains.
    This is a placeholder function and should be replaced with actual logic.
    """
    if not debate_list:
        return "Empty Cluster"
    
def run_clustering(conn, filters: Dict, repeat_depth) -> Dict:
    """returns a dicts like this:
        {
        cluster_group_id: 12345
        no_clusters: 5,
        clusters:[
            {
            cluster_id:12345,
            cluster_title: "enivironmental activism",
            cluster_members: [1,4,20,51,3
            child_clusters: [
            {
            cluster_id: 12346,
            cluster_title: "extinction rebellion",
            cluster_members: [1,4],
            child_clusters: [...]
            }
            ]
            
            }
        }
    """
    relevant_debates = get_debates(filters)
    points = get_points(relevant_debates)
    
    clusters = cluster(points)
    cluster_group_id, cluster_ids = save_clusters(clusters)
    cluster_summary = {
        "cluster_group_id": cluster_group_id,
        "no_clusters": int(len(cluster_ids))
        "clusters": # ask an llm

    return cluster_summary

def cluster(points, config):
    point_labels = cluster_analysis(points, config)
    unique_labels = set(point_labels)
    clusters = []
    for label in unique_labels:
        indices = [i for i, l in enumerate(unique_labels) if l == label]
        cluster_points = [points[i] for i,l in enumerate(labels) if l = label]
        title = title_cluster(cluster_points)
        summary = summarise_cluster(cluster_points, title)
        clusters.append({
            "title": title,
            "summary": summary,
            "members": [point[0] for point in cluster_points]
        })
    return clusters

def summarise_cluster(cluster_points, title):
    """ summarises a cluster of points based on their values and title. Using an LLM"""
    model_input = f"The following points are all part of the same category -{title}. using the additional context of the poinst themselves please provide a 200ish word summary of the arguments, points and concerns revealed in these points: {cluster_points}"


    client = Groq(api_key="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")
    message_list = [{
        "role": "user",
        "content": model_input
    }]
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=message_list,
        temperature=0.0,
        top_p=0.9,
        stop = None,
        stream=False,
    )
    print("LLM response:", response.choices[0].message.content)
    return response.choices[0].message.content.strip()


def title_cluster(cluster_points):
    """ Labels a cluster of points based on their values. Using an LLM"""
    model_input = f"The following points are all part of the same category - I want you to identify what that is: {list_of_points}. Please only return a single phrase that describes the category."

    client = Groq(api_key="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")
    message_list = [{
        "role": "user",
        "content": model_input
    }]
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=message_list,
        temperature=0.0,
        top_p=0.9,
        stop = None,
        stream=False,
    )
    print("LLM response:", response.choices[0].message.content)
    return response.choices[0].message.content.strip()


def cluster_analysis(points, config) -> Dict:
    ids = [point[0] for point in points]
    values = [point[1] for point in points]
    embeddings = [point[2] for point in points]
    kmeans = KMeans(n_clusters=config['n_clusters'], random_state=0)
    kmeans.fit(embeddings)
    labels = kmeans.labels_

def label_clusters(ids, values, labels):
    unique_labels = set(labels)
    for label in unique_labels:
        indices = [i for i, l in enumerate(labels) if l == label]
        cluster_points = [values[i] for i in indices]
        cluster_ids = [ids[i] for i in indices]
        cluster_label = label_cluster(cluster_points)
        print(f"Cluster {label} with IDs {cluster_ids} is labeled as: {cluster_label}")

def get_debates(filters) -> List:



def cluster_debates(conn, filters: Dict = cluster_filter):
    """ Clusters debates based on the provided filters"""
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT debate.ext_id, debate.title, debate.house, contribution.member_id, contribution.value
        FROM debate
        JOIN contribution ON debate.ext_id = contribution.debate_ext_id
        WHERE {("debate.house = %s" if filters['house'] else "") if filters['house'] else ""} {(" AND debate.date BETWEEN %s AND %s" if filters['start_date'] and filters['end_date'] else "")}
    """, (filters['house'], filters['start_date'], filters['end_date']))
    
    debates = cursor.fetchall()
    cursor.close()
    points = get_all_points()
    ids = [point[0] for point in points]
    values = [point[1] for point in points]
    embeddings = [point[2] for point in points]

    clustered_debates = {}

    
""" 
Three data objects:

Cluster_run:
cluster_run_id
start_time
end_time
run_date
houses
number_of_clusters


Cluster:
parent_cluster_id
cluster_id
cluster_run_id
title
description
centre_vector


table to connect points to clusters:
cluster_points:
cluster_id
point_id

"""
