from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AuditLogBase(BaseModel):
    event_type: str
    status: str
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    message: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

class AuditLogRead(AuditLogBase):
    id: int

    class Config:
        from_attributes = True

class AuditLogPaginated(BaseModel):
    items: List[AuditLogRead]
    total: int
    page: int
    page_size: int
