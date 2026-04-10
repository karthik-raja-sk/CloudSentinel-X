from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class ProjectMembershipInvite(BaseModel):
    email: EmailStr
    role: str


class ProjectMembershipRoleUpdate(BaseModel):
    role: str


class ProjectMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    project_id: int
    role: str
    created_at: datetime
    email: EmailStr | None = None
    full_name: str | None = None
