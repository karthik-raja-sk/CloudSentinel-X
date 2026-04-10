from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class ProjectMembership(Base):
    __table_args__ = (UniqueConstraint("user_id", "project_id", name="uq_project_membership_user_project"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="viewer")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    project = relationship("Project")
