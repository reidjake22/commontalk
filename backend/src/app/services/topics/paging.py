# src/app/services/topics/paging.py
from typing import Optional, List
from psycopg2.extras import RealDictCursor
from modules.utils.database_utils import get_db_connection
from modules.models.pagination import PageMeta, PagedResponse
from modules.models.database import Point, Contribution, Debate
from app.api.v1.topics.schemas import RichPointOut  # reuse Out models for convenience

MAX_LIMIT = 200
DEFAULT_LIMIT = 50

def get_cluster_points(
    cluster_id: int,
    limit: int = DEFAULT_LIMIT,
    after_point_id: Optional[int] = None,   # older
    before_point_id: Optional[int] = None,  # newer
) -> PagedResponse[RichPointOut]:
    limit = min(max(1, limit), MAX_LIMIT)

    with get_db_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        # total count in cluster (swap for cached if large)
        cur.execute("SELECT COUNT(*) AS c FROM cluster_points WHERE cluster_id = %s", (cluster_id,))
        total_count = cur.fetchone()["c"]

        if after_point_id and before_point_id:
            # Block ambiguous paging
            return PagedResponse[RichPointOut](data=[], meta=PageMeta(total_count=total_count))

        if after_point_id:
            # Fetch points with ID > after_point_id (newer)
            cur.execute("""
                SELECT 
                    p.point_id, p.contribution_item_id, p.point_value,
                    c.item_id, c.ext_id, c.contribution_type, c.debate_ext_id, c.member_id, 
                    c.attributed_to, c.contribution_value, c.order_in_section, c.timecode, c.hrs_tag, c.created_at,
                    m.member_id AS m_id, m.name_display_as, m.name_full_title, m.thumbnail_url, m.latest_party_membership,
                    d.ext_id AS d_id, d.title, d.date, d.house, d.location, d.debate_type_id, d.parent_ext_id, d.analysed
                FROM cluster_points cp
                JOIN point p ON p.point_id = cp.point_id
                JOIN contribution c ON p.contribution_item_id = c.item_id
                JOIN member m ON c.member_id = m.member_id
                JOIN debate d ON c.debate_ext_id = d.ext_id
                WHERE cp.cluster_id = %s
                  AND p.point_id > %s
                ORDER BY p.point_id ASC
                LIMIT %s
            """, (cluster_id, after_point_id, limit))
            rows = cur.fetchall()
        elif before_point_id:
            # Fetch points with ID < before_point_id (older)
            cur.execute("""
                SELECT 
                    p.point_id, p.contribution_item_id, p.point_value,
                    c.item_id, c.ext_id, c.contribution_type, c.debate_ext_id, c.member_id, 
                    c.attributed_to, c.contribution_value, c.order_in_section, c.timecode, c.hrs_tag, c.created_at,
                    m.member_id AS m_id, m.name_display_as, m.name_full_title, m.thumbnail_url, m.latest_party_membership,
                    d.ext_id AS d_id, d.title, d.date, d.house, d.location, d.debate_type_id, d.parent_ext_id, d.analysed
                FROM cluster_points cp
                JOIN point p ON p.point_id = cp.point_id
                JOIN contribution c ON p.contribution_item_id = c.item_id
                JOIN member m ON c.member_id = m.member_id
                JOIN debate d ON c.debate_ext_id = d.ext_id
                WHERE cp.cluster_id = %s
                  AND p.point_id < %s
                ORDER BY p.point_id DESC
                LIMIT %s
            """, (cluster_id, before_point_id, limit))
            rows = cur.fetchall()
            rows.reverse()  # To maintain ASC order for frontend
        else:
            # First page (newest)
            cur.execute("""
                SELECT 
                    p.point_id, p.contribution_item_id, p.point_value,
                    c.item_id, c.ext_id, c.contribution_type, c.debate_ext_id, c.member_id, 
                    c.attributed_to, c.contribution_value, c.order_in_section, c.timecode, c.hrs_tag, c.created_at,
                    m.member_id AS m_id, m.name_display_as, m.name_full_title, m.thumbnail_url, m.latest_party_membership,
                    d.ext_id AS d_id, d.title, d.date, d.house, d.location, d.debate_type_id, d.parent_ext_id, d.analysed
                FROM cluster_points cp
                JOIN point p ON p.point_id = cp.point_id
                JOIN contribution c ON p.contribution_item_id = c.item_id
                JOIN member m ON c.member_id = m.member_id
                JOIN debate d ON c.debate_ext_id = d.ext_id
                WHERE cp.cluster_id = %s
                ORDER BY p.point_id ASC
                LIMIT %s
            """, (cluster_id, limit))
            rows = cur.fetchall()

    # Map → RichPointOut (same shape your frontend expects)
    data: List[RichPointOut] = []
    for r in rows:
        # date to ISO date (string) if present
        ddate = r["date"]
        strdate = ddate.strftime("%Y-%m-%d") if ddate else None

        data.append(RichPointOut(
            point={"point_id": r["point_id"], "contribution_item_id": r["contribution_item_id"], "point_value": r["point_value"]},
            contribution={
                "item_id": r["item_id"], "ext_id": r["ext_id"], "contribution_type": r["contribution_type"],
                "debate_ext_id": r["debate_ext_id"], "member_id": r["member_id"], "attributed_to": r["attributed_to"],
                "contribution_value": r["contribution_value"], "order_in_section": r["order_in_section"],
                "timecode": r["timecode"], "hrs_tag": r["hrs_tag"], "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            },
            member={
                "member_id": r["m_id"], "name_display_as": r["name_display_as"],
                "name_full_title": r["name_full_title"], "thumbnail_url": r["thumbnail_url"],
                "latest_party_membership": r["latest_party_membership"],
            },
            debate={
                "ext_id": r["d_id"], "title": r["title"], "date": strdate, "house": r["house"],
                "location": r["location"], "debate_type_id": r["debate_type_id"],
                "parent_ext_id": r["parent_ext_id"], "analysed": r["analysed"],
            }
        ))

    next_cursor = str(data[-1].point.point_id) if len(data) == limit else None   # older anchor
    previous_cursor = str(data[0].point.point_id) if data else None              # newer anchor

    return PagedResponse[RichPointOut](
        data=data,
        meta=PageMeta(
            next_cursor=next_cursor,
            prev_cursor=previous_cursor,
            total_count=total_count,
        ),
    )
