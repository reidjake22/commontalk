# backend/src/app/services/search/models.py
from pydantic import BaseModel
from typing import Optional

class SearchTerms(BaseModel):
    member: Optional[str] = None
    party: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    query: Optional[str] = None
