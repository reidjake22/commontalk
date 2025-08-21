from pydantic import BaseModel
from typing import Literal, Union
class JobNotification(BaseModel):
    job_id: Union[int, None]
    status: Literal["completed", "queued",  "not_found"]
