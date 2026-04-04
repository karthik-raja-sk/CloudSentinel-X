from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class IamEntityResponse(BaseModel):
    id: int
    project_id: int
    scan_id: int
    principal_type: str
    principal_id: str
    principal_name: str
    attached_policies: Optional[Any] = None
    inline_policies: Optional[Any] = None
    trust_policy: Optional[Any] = None
    last_used_at: Optional[datetime] = None
    mfa_enabled: Optional[bool] = None
    is_human: Optional[bool] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
