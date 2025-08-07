
from typing import Dict, List

cluster_filter = {
    "house": "Commons",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31"
}


def cluster(conn, filters: Dict = cluster_filter):
    """ Clusters debates based on the provided filters"""


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