from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.db.base_class import Base


class OrganizationInvite(Base):
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False, default="org_member")
    token = Column(String, nullable=False, unique=True, index=True)
    status = Column(String, nullable=False, default="pending")  # pending|accepted|expired|revoked
    created_by_user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
