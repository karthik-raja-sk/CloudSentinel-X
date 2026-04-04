from pydantic import BaseModel, field_validator
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

    @field_validator('principal_type', 'principal_id', 'principal_name', mode='before')
    @classmethod
    def ensure_string(cls, v: Any):
        if v is None:
            return ""
        return str(v)

    class Config:
        from_attributes = True
