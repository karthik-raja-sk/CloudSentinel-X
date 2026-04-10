from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    organization_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: Optional[int] = None
    organization_id: Optional[int] = None
    current_role: Optional[str] = None
    created_at: datetime
