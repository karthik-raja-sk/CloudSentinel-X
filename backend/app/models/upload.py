from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.db.base_class import Base
from datetime import datetime

class Upload(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"))
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
