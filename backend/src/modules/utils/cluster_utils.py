from typing import Dict, Optional, List, Tuple
import json
from ..models.cluster import ClusterData, PartyProportion
from ..models.database import Cluster, Point, Member, Party, Debate
from ..models.pagination import PagedPoints, PageMeta
from datetime import datetime

def check_if_cluster_exists(conn, config: Dict, filters: Dict) -> bool:
    """Check if a cluster already exists for the given filters and config."""
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT COUNT(*) FROM clusters
            WHERE layer = 0 
            AND parent_cluster_id IS NULL
            AND filters_used = %s::jsonb
            AND config = %s::jsonb;
        """
        params = [
            json.dumps(filters, sort_keys=True), 
            json.dumps(config, sort_keys=True)
        ]
        cursor.execute(query, params)
        exists = cursor.fetchone()[0] > 0
        return exists
    except Exception as e:
        print(f"Error checking if cluster exists: {e}")
        return False


def get_cluster_by_setup(conn, filters: Dict, config: Dict, include_points: bool, include_metadata:bool, page_size: int=10) -> Optional[ClusterData]:
    """
    Retrieve existing cluster tree and return as ClusterData object
    """
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT cluster_id, title, summary, layer, created_at, filters_used, config, parent_cluster_id
            FROM clusters 
            WHERE layer = 0 
            AND parent_cluster_id IS NULL
            AND filters_used::jsonb = %s::jsonb
            AND config::jsonb = %s::jsonb
            ORDER BY created_at DESC
            LIMIT 1;
        """, [
            json.dumps(filters, sort_keys=True),
            json.dumps(config, sort_keys=True)
        ])
        
        root_row = cursor.fetchone()
        if not root_row:
            return None
        
        # Build the full tree starting from root
        root_cluster = build_cluster_tree(conn, root_row[0], include_points, include_metadata, page_size)
        return root_cluster
        
    except Exception as e:
        print(f"Error retrieving cluster: {e}")
        return None

def get_cluster_by_id(conn, cluster_id: int, include_points: bool, include_metadata: bool, page_size: int=10) -> Optional[ClusterData]:
    """
    Retrieve existing cluster tree by ID and return as ClusterData object
    """
    cursor = conn.cursor()
    
    try:
        # Build the full tree starting from root
        root_cluster = build_cluster_tree(conn, cluster_id, include_points, include_metadata, page_size)
        return root_cluster

    except Exception as e:
        print(f"Error retrieving cluster: {e}")
        return None

def build_cluster_tree(conn, cluster_id: int, include_points: bool = False, include_metadata: bool = False, page_size: int = 10) -> Optional[ClusterData]:
    """
    Recursively build cluster tree and return as ClusterData object
    """
    cursor = conn.cursor()
    try:
        # Get cluster details
        cursor.execute("""
            SELECT cluster_id, parent_cluster_id, title, summary, layer, created_at, filters_used, config, title_embedding
            FROM clusters 
            WHERE cluster_id = %s;
        """, [cluster_id])
        
        cluster_row = cursor.fetchone()
        if not cluster_row:
            return None
        
        # Create core cluster model
        cluster = Cluster(
            cluster_id=cluster_row[0],
            parent_cluster_id=cluster_row[1],
            title=cluster_row[2],
            summary=cluster_row[3],
            layer=cluster_row[4],
            created_at=cluster_row[5],
            filters_used=cluster_row[6] or {},
            config=cluster_row[7] or {}
        )
        title_embedding = cluster_row[8]
        # Get points if requested
        points = None
        if include_points:
            if title_embedding is not None:
                logger.info("start")
                # Semantic order: nearest to title, tie-break by point_id
                cursor.execute("""
                    SELECT
                        p.point_id,
                        p.contribution_item_id,
                        p.point_value
                    FROM cluster_points cp
                    JOIN point     p  ON cp.point_id   = p.point_id
                    JOIN clusters  cl ON cp.cluster_id = cl.cluster_id
                    WHERE cp.cluster_id = %s
                    AND cl.title_embedding IS NOT NULL
                    ORDER BY (p.point_embedding <=> cl.title_embedding) ASC, p.point_id ASC
                    LIMIT %s
                """, [cluster_id, page_size])
                logger.info("stop")
            else:
                # Fallback: chronological
                cursor.execute("""
                    SELECT p.point_id, p.contribution_item_id, p.point_value
                    FROM cluster_points cp
                    JOIN point p ON cp.point_id = p.point_id
                    WHERE cp.cluster_id = %s
                    ORDER BY p.point_id ASC
                    LIMIT %s
                """, [cluster_id, page_size])

            points = []
            for point_row in cursor.fetchall():
                points.append(Point(
                    point_id=point_row[0],
                    contribution_item_id=point_row[1],
                    point_value=point_row[2]
                ))
        
        # Get sub-clusters
        cursor.execute("""
            SELECT cluster_id 
            FROM clusters 
            WHERE parent_cluster_id = %s
            ORDER BY cluster_id;
        """, [cluster_id])
        
        sub_clusters = []
        for sub_row in cursor.fetchall():
            sub_cluster = build_cluster_tree(conn, sub_row[0], include_points, include_metadata, page_size)
            if sub_cluster:
                sub_clusters.append(sub_cluster)
        debates = get_debates(cluster_id)
        if include_points:
            next_cursor = str(points[-1].point_id) if len(points) == page_size else None
            paged_points = PagedPoints(data=points, meta=PageMeta(next_cursor=next_cursor))
        
            # Create cluster data object
            cluster_data = ClusterData(
                cluster=cluster,
                points=paged_points,
                sub_clusters=sub_clusters,
                debates=debates
                )
        else:
            cluster_data = ClusterData(
                cluster=cluster,
                points=None,
                sub_clusters=sub_clusters,
                debates=debates
            )

        # Add metadata if requested
        if include_metadata:
            cluster_data.contributors = get_contributors(cluster_data)
            cluster_data.proportions = get_proportions(cluster_data)
        
        return cluster_data
        
    except Exception as e:
        print(f"Error building cluster tree for ID {cluster_id}: {e}")
        return None



def get_proportions(cluster: ClusterData) -> List[PartyProportion]:
    """Extracts proportions from a cluster by counting points grouped by party."""
    if not cluster or not cluster.cluster_id:
        return []
    
    from ..utils.database_utils import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # SQL query to get party counts for a cluster with full party data
        query = """
        SELECT 
            p.party_id, p.name, p.abbreviation, p.background_colour, p.foreground_colour,
            p.is_lords_main_party, p.is_lords_spiritual_party, p.government_type, p.is_independent_party,
            COUNT(cp.point_id) as point_count
        FROM cluster_points cp
        JOIN point pt ON cp.point_id = pt.point_id
        JOIN contribution c ON pt.contribution_item_id = c.item_id
        JOIN member m ON c.member_id = m.member_id
        JOIN party p ON m.latest_party_membership = p.party_id
        WHERE cp.cluster_id = %s
        GROUP BY p.party_id, p.name, p.abbreviation, p.background_colour, p.foreground_colour,
                 p.is_lords_main_party, p.is_lords_spiritual_party, p.government_type, p.is_independent_party
        ORDER BY point_count DESC;
        """
        
        cursor.execute(query, [cluster.cluster_id])
        results = cursor.fetchall()
        
        proportions = []
        for row in results:
            party = Party(
                party_id=row[0],
                name=row[1],
                abbreviation=row[2],
                background_colour=row[3],
                foreground_colour=row[4],
                is_lords_main_party=row[5],
                is_lords_spiritual_party=row[6],
                government_type=row[7],
                is_independent_party=row[8]
            )
            proportions.append(PartyProportion(party=party,count=row[9]))
        
        return proportions
        
    except Exception as e:
        print(f"Error getting proportions for cluster {cluster.cluster_id}: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_contributors(cluster: ClusterData, limit: int = 5) -> List[Member]:
    """Gets top contributors (member names) for a cluster by point count."""
    if not cluster or not cluster.cluster_id:
        return []
    
    from ..utils.database_utils import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # SQL query to get top contributing members for a cluster
        query = """
        SELECT 
            m.member_id, m.name_display_as, m.latest_party_membership,
            COUNT(cp.point_id) as point_count
        FROM cluster_points cp
        JOIN point p ON cp.point_id = p.point_id
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN member m ON c.member_id = m.member_id
        WHERE cp.cluster_id = %s
        GROUP BY m.member_id, m.name_display_as, m.latest_party_membership
        ORDER BY point_count DESC
        LIMIT %s;
        """
        
        cursor.execute(query, [cluster.cluster_id, limit])
        results = cursor.fetchall()
        
        contributors = []
        for row in results:
            contributors.append(Member(
                member_id=row[0],
                name_display_as=row[1],
                latest_party_membership=row[2]
            ))
        
        return contributors
        
    except Exception as e:
        print(f"Error getting contributors for cluster {cluster.cluster_id}: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_debates(cluster_id: int) -> Optional[List[Debate]]:
    """Retrieve debates associated with a cluster."""
    from ..utils.database_utils import get_db_connection

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT DISTINCT d.ext_id, d.title, d.date
            FROM debate d
            JOIN contribution ctr ON ctr.debate_ext_id = d.ext_id
            JOIN point p ON p.contribution_item_id = ctr.item_id
            JOIN cluster_points cp ON cp.point_id = p.point_id
            WHERE cp.cluster_id = %s
        """, [cluster_id])

        rows = cursor.fetchall()
        debates = []
        for row in rows:
            debates.append(Debate(
                ext_id=row[0],
                title=row[1],
                date=datetime.strftime(row[2], "%Y-%m-%d")
            ))

        return debates if debates else None

    except Exception as e:
        print(f"Error retrieving debates for cluster {cluster_id}: {e}")
        return None
    finally:
        cursor.close()

def get_cluster_points_after(conn, cluster_id: int, after_id: int, page_size: int = 50) -> PagedPoints:
    cur = conn.cursor()
    cur.execute("""
        SELECT p.point_id, p.contribution_item_id, p.point_value
        FROM cluster_points cp
        JOIN point p ON p.point_id = cp.point_id
        WHERE cp.cluster_id = %s
          AND p.point_id > %s
        ORDER BY p.point_id ASC
        LIMIT %s
    """, [cluster_id, after_id, page_size])

    rows = cur.fetchall()
    data: List[Point] = [Point(point_id=r[0], contribution_item_id=r[1], point_value=r[2]) for r in rows]
    next_cursor = str(data[-1].point_id) if len(data) == page_size else None
    return PagedPoints(data=data, meta=PageMeta(next_cursor=next_cursor, page_size=page_size))

def create_job(params: dict) -> int:
    from ..utils.database_utils import get_db_connection
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO cluster_jobs (status, params)
                VALUES ('queued', %s::jsonb)
                RETURNING job_id
            """, [json.dumps(params, sort_keys=True)])
            job_id = cur.fetchone()[0]
        conn.commit()
        return job_id
    finally:
        conn.close()


def set_job_status(job_id: int, status: str, message: str | None = None, error: str | None = None):
    from ..utils.database_utils import get_db_connection
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
              UPDATE cluster_jobs
                 SET status=%s,
                     message=COALESCE(%s, message),
                     error=COALESCE(%s, error),
                     started_at = CASE WHEN %s='running' THEN now() ELSE started_at END,
                     finished_at = CASE WHEN %s IN ('complete','failed','canceled') THEN now() ELSE finished_at END
               WHERE job_id=%s
            """, [status, message, error, status, status, job_id])
        conn.commit()
    finally:
        conn.close()

def finalise_job(job_id: int):
    from ..utils.database_utils import get_db_connection

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # flip all clusters written by this job from draft→final
            cur.execute("UPDATE clusters SET visible=TRUE WHERE job_id=%s", [job_id])
            cur.execute("""
                UPDATE cluster_jobs
                   SET status='complete', finished_at=now()
                 WHERE job_id=%s
            """, [job_id])
        conn.commit()
    finally:
        conn.close()

def get_job_status(job_id):
    from ..utils.database_utils import get_db_connection

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT status FROM cluster_jobs WHERE job_id=%s", [job_id])
            row = cur.fetchone()
            cur.close()
            if row[0] == "complete":
                root_cluster_id = get_root_cluster_by_job_id(conn, job_id)
                return {
                    "job_id": job_id,
                    "status": row[0],
                    "root_cluster_id": root_cluster_id
                }
            if row:
                return {
                    "job_id": job_id,
                    "status": row[0],
                }

    except Exception as e:
        print(f"Error getting job status for job {job_id}: {e}")
        raise Exception("Failed to retrieve job status")

def get_root_cluster_by_job_id(conn, job_id: int) -> Optional[int]:
    """Retrieve the root cluster ID for a given job ID."""
    cursor = conn.cursor()
    print(f"job id: {job_id}")
    try:
        cursor.execute("""
            SELECT cluster_id
            FROM clusters
            WHERE layer = 0
            AND job_id = %s
        """, [job_id])
        row = cursor.fetchone()
        return row[0] if row else None
    except:
        raise Exception
    finally:
        cursor.close()

def get_points_clusters_for_debate(conn, debate_ext_id: str) -> List[Dict]:
    """
    Get all points, their clusters, and debate info for a given debate_ext_id.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            p.point_id,
            p.point_value,
            c.cluster_id,
            cl.title AS cluster_title,
            d.ext_id AS debate_ext_id,
            d.title AS debate_title,
            d.date AS debate_date
        FROM debate d
        JOIN contribution ctr ON ctr.debate_ext_id = d.ext_id
        JOIN point p ON p.contribution_item_id = ctr.item_id
        JOIN cluster_points c ON c.point_id = p.point_id
        JOIN clusters cl ON cl.cluster_id = c.cluster_id
        WHERE d.ext_id = %s
        ORDER BY cl.cluster_id, p.point_id
    """, [debate_ext_id])
    results = cursor.fetchall()
    cursor.close()
    return [
        {
            "point_id": r[0],
            "point_value": r[1],
            "cluster_id": r[2],
            "cluster_title": r[3],
            "debate_ext_id": r[4],
            "debate_title": r[5],
            "debate_date": r[6],
        }
        for r in results
    ]


def get_job_status_by_setup(conn, config: Dict, filters: Dict) -> Dict:
    """
    Get the job status for a specific cluster setup.
    Returns None if no job exists for the given setup.
    """
    cursor = conn.cursor()
    try:
        params = {"config": config, "filters": filters}
        cursor.execute("""
            SELECT job_id, status
            FROM cluster_jobs
            WHERE params::jsonb @> %s::jsonb
        """, [json.dumps(params)])

        row = cursor.fetchone()
        if row:
            return {
                "job_id": row[0],
                "status": row[1],
            }
        else:
            return {
                "job_id": None,
                "status": "not_found"
            }
    except Exception as e:
        print(f"Error getting job status: {e}")
        raise Exception("Failed to retrieve job status")
    finally:
        cursor.close()
