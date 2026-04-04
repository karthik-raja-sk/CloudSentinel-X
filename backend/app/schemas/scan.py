from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ScanResponse(BaseModel):
    id: int
    project_id: int
    status: str
    scan_type: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
