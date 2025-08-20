from pydantic import BaseModel, Field
from typing import Optional

class PollOut(BaseModel):
    """API v1 polling model."""
    job_id: str = Field(..., description="Unique identifier for the polling job.")
    root_cluster_id: Optional[int] = Field(None, description="ID of the root cluster if available.")
    status: str = Field(..., description="Current status of the polling job.")
    error: Optional[str] = Field(None, description="Error message if the polling job failed.")