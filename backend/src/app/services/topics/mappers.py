from typing import List
from .models import FeaturedTopic, LightMember, LightParty, SingleTopic, RichPoint, LightPartyProportion
from modules.models.cluster import ClusterData, PartyProportion
from modules.models.database import Point, Contribution, Member, Debate
from modules.models.pagination import PagedResponse, PageMeta
def map_cluster_to_featured_topics(cluster: ClusterData) -> List[FeaturedTopic]:
    """
    Maps a cluster's sub-clusters to a list of featured topics.
    """
    featured_topics = []
    
    for sub_cluster in cluster.sub_clusters:
        featured_topic = map_single_cluster_to_featured_topic(sub_cluster)
        featured_topics.append(featured_topic)
    
    return featured_topics

def map_single_cluster_to_featured_topic(cluster: ClusterData) -> FeaturedTopic:
    """
    Maps a single ClusterData to FeaturedTopic.
    """
    
    # Extract contributors from cluster metadata
    contributors = []
    if cluster.contributors:
        for member in cluster.contributors[:5]:  # Limit to top 5
            contributors.append(LightMember(
                member_id=member.member_id,
                name_display_as=member.name_display_as,
                name_full_title=member.name_full_title,
                thumbnail_url=member.thumbnail_url,
                latest_party_membership=member.latest_party_membership
            ))
    
    # Extract proportions from cluster metadata  
    proportions = []
    if cluster.proportions:
        for party, count in cluster.proportions[:3]:  # Top 3 parties
            light_party = LightParty(
                party_id=party.party_id,
                name=party.name,
                abbreviation=party.abbreviation,
                background_colour=party.background_colour,
                foreground_colour=party.foreground_colour
            )
            proportions.append((light_party, count))
    
    # Recursively map any sub-clusters to sub_topics
    sub_topics = []
    if cluster.sub_clusters:
        for sub_cluster in cluster.sub_clusters:
            sub_topic = map_single_cluster_to_featured_topic(sub_cluster)
            sub_topics.append(sub_topic)
    
    return FeaturedTopic(
        topic_id=str(cluster.cluster_id),
        title=cluster.title,
        summary=cluster.summary,
        contributors=contributors,
        proportions=proportions,
        sub_topics=sub_topics if sub_topics else None
    )

def map_cluster_to_single_topic(cluster: ClusterData) -> SingleTopic:
    """
    Maps a ClusterData object to a SingleTopic object.
    """
    print("mapping")
    rich_points = map_points_to_rich_points(cluster.points)
    print("points slice")
    contributors = map_contributors_to_light_members(cluster.contributors)
    print("contributors")
    proportions = map_proportions_to_light_parties(cluster.proportions)
    print("proportions")
    sub_topics = map_cluster_to_featured_topics(cluster)
    print("sub topics")
    
    # Create SingleTopic object
    print("Creating SingleTopic object")
    return SingleTopic(
        topic_id=str(cluster.cluster_id),
        title=cluster.title,
        summary=cluster.summary,
        rich_points=rich_points,
        contributors=contributors,
        proportions=proportions,
        sub_topics=sub_topics
    )

def map_points_to_rich_points(points: PagedResponse[Point]) -> PagedResponse[RichPoint]:
    """
    Maps Point objects to RichPoint objects with related data.
    """
    if not points:
        return PagedResponse[RichPoint](data=[], meta=PageMeta())

    from modules.utils.database_utils import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        point_ids = [point.point_id for point in points.data]

        if not point_ids:
            return PagedResponse[RichPoint](data=[], meta=PageMeta())

        # Build query with IN clause for multiple points
        placeholders = ','.join(['%s'] * len(point_ids))
        query = f"""
        SELECT 
            p.point_id, p.contribution_item_id, p.point_value,
            c.item_id, c.ext_id, c.contribution_type, c.debate_ext_id, c.member_id, 
            c.attributed_to, c.contribution_value, c.order_in_section, c.timecode, c.hrs_tag, c.created_at,
            m.member_id, m.name_display_as, m.name_full_title, m.thumbnail_url, m.latest_party_membership,
            d.ext_id, d.title, d.date, d.house, d.location, d.debate_type_id, d.parent_ext_id, d.analysed
        FROM point p
        JOIN contribution c ON p.contribution_item_id = c.item_id
        JOIN member m ON c.member_id = m.member_id
        JOIN debate d ON c.debate_ext_id = d.ext_id
        WHERE p.point_id IN ({placeholders})
        ORDER BY p.point_id;
        """
        
        cursor.execute(query, point_ids)
        results = cursor.fetchall()
        
        # Create RichPoint objects
        rich_points = []
        for row in results:
            # Create Point object
            point = Point(
                point_id=row[0],
                contribution_item_id=row[1],
                point_value=row[2]
            )
            
            # Create Contribution object
            contribution = Contribution(
                item_id=row[3],
                ext_id=row[4],
                contribution_type=row[5],
                debate_ext_id=row[6],
                member_id=row[7],
                attributed_to=row[8],
                contribution_value=row[9],
                order_in_section=row[10],
                timecode=row[11],
                hrs_tag=row[12],
                created_at=row[13]
            )
            
            # Create LightMember object
            member = LightMember(
                member_id=row[14],
                name_display_as=row[15],
                name_full_title=row[16],
                thumbnail_url=row[17],
                latest_party_membership=row[18]
            )

            # Create Debate object
            strdate = row[21].strftime('%Y-%m-%d')
            debate = Debate(
                ext_id=row[19],
                title=row[20],
                date=strdate,
                house=row[22],
                location=row[23],
                debate_type_id=row[24],
                parent_ext_id=row[25],
                analysed=row[26]
            )
            
            # Create RichPoint object
            rich_point = RichPoint(
                point=point,
                contribution=contribution,
                member=member,
                debate=debate
            )
            
            rich_points.append(rich_point)
        
        print(rich_points[0])
        return rich_points
        
    except Exception as e:
        print(f"Error creating rich points: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def map_contributors_to_light_members(contributors: List[Member]) -> List[LightMember]:
    """Convert Member objects to LightMember objects."""
    if not contributors:
        return []
    
    light_members = []
    for member in contributors[:5]:  # Limit to top 5
        light_members.append(LightMember(
            member_id=member.member_id,
            name_display_as=member.name_display_as,
            name_full_title=member.name_full_title,
            thumbnail_url=member.thumbnail_url,
            latest_party_membership=member.latest_party_membership
        ))
    return light_members

def map_proportions_to_light_parties(proportions: List[PartyProportion]) -> List[LightPartyProportion]:
    """Convert Party/count tuples to LightParty/count tuples."""
    if not proportions:
        return []
    
    light_proportions = []
    for party_proportion in proportions[:3]:  # Top 3 parties
        light_party = LightParty(
            party_id=party_proportion.party.party_id,
            name=party_proportion.party.name,
            abbreviation=party_proportion.party.abbreviation,
            background_colour=party_proportion.party.background_colour,
            foreground_colour=party_proportion.party.foreground_colour
        )
        light_proportions.append(LightPartyProportion(party=light_party, count=party_proportion.count))
    return light_proportions
