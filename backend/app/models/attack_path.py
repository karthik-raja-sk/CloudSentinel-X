from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from app.db.base_class import Base

class AttackPath(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"))
    scan_id = Column(Integer, ForeignKey("scan.id"))
    title = Column(String, index=True)
    description = Column(String)
    severity = Column(String, index=True)
    risk_score = Column(Integer, default=0)
    path_nodes = Column(JSON, nullable=True) # list of { type: str, id: str/int, name?: str }
    path_edges = Column(JSON, nullable=True) # list of { from: str, to: str, relation: str }
    created_at = Column(DateTime, nullable=True)
