from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from modules.models.database import Point, Debate, Contribution

class LightMember(BaseModel):
    """Minimal member model for frontend display."""
    member_id: str
    name_display_as: str
    name_full_title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    latest_party_membership: Optional[str] = None

class LightParty(BaseModel):
    """Minimal party model for frontend display."""
    party_id: str
    name: str
    abbreviation: Optional[str] = None
    background_colour: Optional[str] = None
    foreground_colour: Optional[str] = None


class FeaturedTopic(BaseModel):
    """Detailed topic with additional metadata."""
    topic_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    contributors: List['LightMember'] = Field(default_factory=list)
    proportions: List[tuple['LightParty', int]] = Field(default_factory=list)
    sub_topics: Optional[List['FeaturedTopic']] = Field(default_factory=list)

FeaturedTopic.model_rebuild()

class RichPoint(BaseModel):
    """ Model for point data plus contribution and member and debate metadata."""
    point: Point
    debate: Debate
    contribution: Contribution
    member: LightMember

class SingleTopic(BaseModel):
    """Model for a single topic with its ID."""
    topic_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    points_slice: List['RichPoint'] # RichPoints are pretty heavy and there are a lot of points - probs better to slice this and create call to generate more
    contributors: List[LightMember] = Field(default_factory=list)
    proportions: List[tuple[LightParty, int]] = Field(default_factory=list)
    sub_topics: Optional[List[FeaturedTopic]] = Field(default_factory=list)
