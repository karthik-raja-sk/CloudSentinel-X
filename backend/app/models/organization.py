from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from app.db.base_class import Base


class Organization(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
