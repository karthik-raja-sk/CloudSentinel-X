from sqlalchemy import Boolean, Column, Integer, String, DateTime
from app.db.base_class import Base
import datetime

class AuditLog(Base):
    __tablename__ = "auditlog" # if Base uses lowercase default or not. Let's make it standard
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)
    project_id = Column(Integer, nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status = Column(String, nullable=False) # 'success', 'failure'
    message = Column(String, nullable=True)
    details = Column(String, nullable=True) # JSON stored as string for simplicity
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
