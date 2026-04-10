from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    current_role: str | None = None
    created_at: datetime


class OrganizationCreate(BaseModel):
    name: str


class OrganizationInviteCreate(BaseModel):
    email: EmailStr
    role: str  # org_admin|org_member


class OrganizationInviteAccept(BaseModel):
    token: str


class OrganizationMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    organization_id: int
    user_id: int
    role: str
    created_at: datetime
    email: EmailStr | None = None
    full_name: str | None = None
