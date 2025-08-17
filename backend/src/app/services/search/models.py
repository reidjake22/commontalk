from pydantic import BaseModel, Field
from typing import Optional, List, Dict
class SearchTerms(BaseModel):
    member: Optional[str] = None
    party: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    query: Optional[str] = None
