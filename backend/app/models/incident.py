from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.db.base_class import Base

class Incident(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"), index=True)
    title = Column(String)
    severity = Column(String, index=True)
    affected_resources = Column(JSON, nullable=True) # List of resources affected
    attack_path = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
    status = Column(String, default="OPEN", index=True)
