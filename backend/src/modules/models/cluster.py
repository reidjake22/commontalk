from typing import Optional, List, Tuple
from pydantic import BaseModel, Field
from .database import Cluster, Point, Contribution, Member, Party

# Define the cluster structure with Pydantic
class ClusterPoint(BaseModel):
    id: int
    text: str
    
class ClusterData(BaseModel):
    """Extended cluster model with related data for API responses"""
    # Core cluster data
    cluster: Cluster
    
    # Related data
    points: Optional[List[Point]] = None
    sub_clusters: List['ClusterData'] = Field(default_factory=list)
    
    # Computed metadata
    contributors: Optional[List[Member]] = None
    proportions: Optional[List[Tuple[Party, int]]] = None  # (Party object, count)
    
    @property
    def cluster_id(self) -> int:
        return self.cluster.cluster_id
    
    @property
    def title(self) -> Optional[str]:
        return self.cluster.title
    
    @property
    def summary(self) -> Optional[str]:
        return self.cluster.summary

# Enable self-reference
ClusterData.model_rebuild()