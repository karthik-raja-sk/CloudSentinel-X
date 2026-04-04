from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(user: UserLogin):
    return {"access_token": "stub_token", "token_type": "bearer"}

@router.post("/register")
def register(user: UserCreate):
    return {"msg": "User created successfully", "email": user.email}
