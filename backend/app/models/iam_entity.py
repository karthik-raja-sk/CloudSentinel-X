from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from app.db.base_class import Base

class IamEntity(Base):
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"))
    scan_id = Column(Integer, ForeignKey("scan.id"))
    principal_type = Column(String, index=True) # User, Role, Group, Policy
    principal_id = Column(String, index=True)
    principal_name = Column(String, index=True)
    attached_policies = Column(JSON, nullable=True)
    inline_policies = Column(JSON, nullable=True)
    trust_policy = Column(JSON, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    mfa_enabled = Column(Boolean, nullable=True)
    is_human = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=True)
