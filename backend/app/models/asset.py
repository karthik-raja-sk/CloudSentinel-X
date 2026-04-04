from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.db.base_class import Base

class Asset(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"))
    asset_type = Column(String, index=True)
    resource_id = Column(String, index=True)
    resource_name = Column(String)
    region = Column(String, nullable=True)
    criticality = Column(String, default="medium")
    raw_config = Column(JSON)
