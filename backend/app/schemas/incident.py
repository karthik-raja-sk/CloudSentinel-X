from pydantic import BaseModel, field_validator
from typing import Optional, List, Any

class IncidentBase(BaseModel):
    title: str
    severity: str
    affected_resources: Optional[List[str]] = []
    attack_path: Optional[str] = None
    recommendation: Optional[str] = None
    status: Optional[str] = "OPEN"

    @field_validator('title', 'severity', 'attack_path', 'recommendation', 'status', mode='before')
    @classmethod
    def ensure_string(cls, v: Any):
        if v is None:
            return ""
        return str(v)

class IncidentCreate(IncidentBase):
    project_id: int

class IncidentResponse(IncidentBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True
