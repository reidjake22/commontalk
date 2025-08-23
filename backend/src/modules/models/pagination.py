from .database import Point
from typing import List, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
    next_cursor: Optional[int] = None
    prev_cursor: Optional[int] = None
    total_count: Optional[int] = None

class PagedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PageMeta

class PagedPoints(PagedResponse[Point]):
    data: List[Point]  # concrete type for data
