from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Party(BaseModel):
    party_id: str
    name: str
    abbreviation: Optional[str] = None
    background_colour: Optional[str] = None
    foreground_colour: Optional[str] = None
    is_lords_main_party: bool = False
    is_lords_spiritual_party: bool = False
    government_type: Optional[str] = None
    is_independent_party: bool = False

class Member(BaseModel):
    member_id: str
    name_list_as: Optional[str] = None
    name_display_as: str
    name_full_title: Optional[str] = None
    name_address_as: Optional[str] = None
    latest_party_membership: Optional[str] = None
    latest_house_membership_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    gender: Optional[str] = None
    membership_from: Optional[str] = None
    membership_start_date: Optional[datetime] = None
    membership_end_date: Optional[datetime] = None
    house: Optional[int] = None
    status_is_active: bool = True

class Debate(BaseModel):
    ext_id: str
    title: str
    date: str
    house: Optional[str] = None
    location: Optional[str] = None
    debate_type_id: Optional[str] = None
    parent_ext_id: Optional[str] = None
    analysed: bool = False

class Contribution(BaseModel):
    item_id: str
    ext_id: Optional[str] = None
    contribution_type: Optional[str] = None
    debate_ext_id: Optional[str] = None
    member_id: Optional[str] = None
    attributed_to: Optional[str] = None
    contribution_value: Optional[str] = None
    order_in_section: Optional[int] = None
    timecode: Optional[str] = None
    hrs_tag: Optional[str] = None
    created_at: Optional[datetime] = None

class Point(BaseModel):
    point_id: int
    contribution_item_id: Optional[str] = None
    point_value: Optional[str] = None
    point_embedding: Optional[List[float]] = None

class Cluster(BaseModel):
    cluster_id: int
    parent_cluster_id: Optional[int] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    layer: Optional[int] = None
    created_at: Optional[datetime] = None
    filters_used: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    