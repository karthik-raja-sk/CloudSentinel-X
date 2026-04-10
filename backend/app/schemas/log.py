from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class LogEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    scan_id: int
    event_time: str
    source_service: str
    event_name: str
    principal_id: str
    source_ip: str
    user_agent: Optional[str] = None
    region: Optional[str] = None
    response_status: Optional[str] = None
    error_code: Optional[str] = None
    raw_event: Optional[Any] = None
    created_at: Optional[datetime] = None
