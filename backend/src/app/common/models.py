from pydantic import BaseModel
class JobNotification(BaseModel):
    job_id: int