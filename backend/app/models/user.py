import datetime
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst", nullable=False)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=True, index=True)
    
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    is_verified = Column(Boolean(), default=False)
    
    hashed_refresh_token = Column(String, nullable=True)
    refresh_token_id = Column(String, index=True, unique=True, nullable=True)
    
    verification_token = Column(String, index=True, nullable=True)
    verification_token_expiry = Column(DateTime, nullable=True)
    
    reset_token = Column(String, index=True, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

