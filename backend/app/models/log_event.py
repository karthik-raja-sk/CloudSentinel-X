from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from app.db.base_class import Base

class LogEvent(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"))
    scan_id = Column(Integer, ForeignKey("scan.id"))
    event_time = Column(String, index=True)
    source_service = Column(String, index=True)
    event_name = Column(String, index=True)
    principal_id = Column(String, index=True)
    source_ip = Column(String, index=True)
    user_agent = Column(String, nullable=True)
    region = Column(String, nullable=True)
    response_status = Column(String, nullable=True) # e.g. success, failure
    error_code = Column(String, nullable=True)
    raw_event = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=True)
