from typing import List, Optional
from pydantic import BaseModel, Field
from typing import List, Optional, Generic, TypeVar

T = TypeVar("T")


class LightMemberOut(BaseModel):
    """API v1 minimal member model for frontend display."""
    member_id: str
    name_display_as: str
    name_full_title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    latest_party_membership: Optional[str] = None

class LightPartyOut(BaseModel):
    """API v1 minimal party model for frontend display."""
    party_id: str
    name: str
    abbreviation: Optional[str] = None
    background_colour: Optional[str] = None
    foreground_colour: Optional[str] = None

class FeaturedTopicOut(BaseModel):
    """API v1 topic with additional metadata."""
    topic_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    contributors: List[LightMemberOut] = Field(default_factory=list)
    proportions: List[tuple[LightPartyOut, int]] = Field(default_factory=list)
    sub_topics: Optional[List['FeaturedTopicOut']] = Field(default_factory=list)

FeaturedTopicOut.model_rebuild()

class FeaturedTopicsOut(BaseModel):
    topics: list[FeaturedTopicOut]
    
class PointOut(BaseModel):
    """API v1 point model."""
    point_id: int
    contribution_item_id: Optional[str] = None
    point_value: Optional[str] = None

class ContributionOut(BaseModel):
    """API v1 contribution model."""
    item_id: str
    ext_id: Optional[str] = None
    contribution_type: Optional[str] = None
    member_id: Optional[str] = None
    contribution_value: Optional[str] = None

class DebateOut(BaseModel):
    """API v1 debate model."""
    ext_id: str
    title: str
    date: str  # ISO format string for API
    house: Optional[str] = None
    location: Optional[str] = None

class RichPointOut(BaseModel):
    """API v1 rich point model."""
    point: PointOut
    debate: DebateOut
    contribution: ContributionOut
    member: LightMemberOut



class PageMetaOut(BaseModel):
    next_cursor: Optional[int] = None
    prev_cursor: Optional[int] = None
    total_count: Optional[int] = None

class PagedResponseOut(BaseModel, Generic[T]):
    data: List[T]
    meta: PageMetaOut

class PagedPointsOut(PagedResponseOut[RichPointOut]):
    data: List[RichPointOut]  # concrete type for data


class PartyProportionOut(BaseModel):
    """API v1 party proportion model."""
    party: LightPartyOut
    count: int

class SingleTopicOut(BaseModel):
    """API v1 single topic response."""
    topic_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    points: Optional[PagedPointsOut] = None
    contributors: List[LightMemberOut] = Field(default_factory=list)
    proportions: List[PartyProportionOut] = Field(default_factory=list)
    debates: Optional[List[DebateOut]] = None
    sub_topics: Optional[List[FeaturedTopicOut]] = Field(default_factory=list)

class FeaturedTopicsOut(BaseModel):
    """API v1 featured topics response."""
    topics: List[FeaturedTopicOut] = Field(default_factory=list)
    total_count: int = 0
    date_range: Optional[str] = None

class ErrorSchema(BaseModel):
    """API v1 error response."""
    error: str
    message: str
    status_code: int