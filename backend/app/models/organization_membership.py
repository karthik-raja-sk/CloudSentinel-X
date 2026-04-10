from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from app.db.base_class import Base


class OrganizationMembership(Base):
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_membership_org_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="org_member")  # org_admin | org_member
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
