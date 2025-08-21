# Imports
import logging
import argparse
import sys
from typing import Optional, Dict
from datetime import datetime

# Relative Imports
from .recursion import cluster_recursive
from ..utils.database_utils import get_db_connection
from ..utils.cluster_utils import finalise_job
from .config import default_config
from .retrieve_points import get_points, get_top_points_by_embedding

#### MAIN FUNCTION ######
def run_clustering(config, filters: Optional[Dict] = None) -> Dict:
    print(config)
    conn = get_db_connection()
    filters = filters or {}
    print(f"Running clustering with filters: {filters}")
    if filters.get("member"):
        filters["member_ids"] = [filters["member"]]
    if config.get("search") and filters.get("query"):
        points = get_top_points_by_embedding(conn, filters, filters['query'] )
    else:
        points = get_points(conn, filters)
    if not points:
        logging.warning("No points found for clustering.")
        return {}
    current_depth = 0
    clusters = cluster_recursive(conn, points, config, filters, current_depth)
    conn.close()
    finalise_job(config['job_id'])
    print("Clustering job finalised")
    clean_clusters = strip_embeddings(clusters)
    print("returning clean clusters")
    return clean_clusters

def strip_embeddings(data):
    """Recursively remove 'embedding' keys from nested data structures"""
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if key == 'embedding':
                continue  # Skip embedding keys entirely
            else:
                result[key] = strip_embeddings(value)
        return result
    elif isinstance(data, list):
        return [strip_embeddings(item) for item in data]
    else:
        return data


def main():
    print("starting")
    parser = argparse.ArgumentParser(description='Run clustering analysis with date range')
    parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--house', help='Parliamentary house (Commons/Lords)')
    parser.add_argument('--max-depth', type=int, default=2, help='Maximum clustering depth')
    
    args = parser.parse_args()

     # Validate date format
    try:
        datetime.strptime(args.start_date, '%Y-%m-%d')
        datetime.strptime(args.end_date, '%Y-%m-%d')
    except ValueError:
        print("Error: Dates must be in YYYY-MM-DD format")
        sys.exit(1)
    
    # Setup logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    config = default_config.copy()
    # Build filters
    filters = {
        'start_date': args.start_date,
        'end_date': args.end_date
    }
    print(f"Running clustering from {args.start_date} to {args.end_date}")

    if args.house:
        filters['house'] = args.house
        print(f"filtering for house {filters['house']}")
    if args.max_depth:
        config['max_depth'] = args.max_depth
        print(f"using max_depth {config['max_depth']}")
    conn = get_db_connection()


    result = run_clustering(config, filters)
    if result:
        print(f"Clustering completed successfully")
        print(f"Root cluster ID: {result.get('cluster_id')}")
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))

        response = input("do you want to enter a shell? Y/N: ").upper()
        if response == 'Y':
            import IPython; IPython.embed()
    else:
        print("No clusters created")


if __name__ == "__main__":
    main()