from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = None

class UserInDBBase(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    organization_id: Optional[int] = None
    is_active: bool
    is_superuser: bool
    is_verified: bool

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
