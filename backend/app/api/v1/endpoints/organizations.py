from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.db.session import get_db
from app.models.organization import Organization
from app.models.organization_membership import OrganizationMembership
from app.models.organization_invite import OrganizationInvite
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationInviteAccept,
    OrganizationInviteCreate,
    OrganizationMembershipResponse,
    OrganizationResponse,
)
from app.services.email_service import EmailService
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/", response_model=list[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.is_superuser or (current_user.role or "").lower().startswith("demo_"):
        orgs = db.query(Organization).order_by(Organization.id.asc()).all()
        return [OrganizationResponse.model_validate({**o.__dict__, "current_role": "org_admin"}) for o in orgs]
    memberships = db.query(OrganizationMembership).filter(OrganizationMembership.user_id == current_user.id).all()
    org_ids = [m.organization_id for m in memberships]
    role_map = {m.organization_id: m.role for m in memberships}
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).order_by(Organization.id.asc()).all()
    return [OrganizationResponse.model_validate({**o.__dict__, "current_role": role_map.get(o.id)}) for o in orgs]


@router.post("/", response_model=OrganizationResponse)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    org = Organization(name=payload.name)
    db.add(org)
    db.commit()
    db.refresh(org)

    membership = OrganizationMembership(organization_id=org.id, user_id=current_user.id, role="org_admin")
    db.add(membership)
    db.commit()

    AuditService.log(db, "organization_created", "success", user_id=current_user.id, email=current_user.email)
    return OrganizationResponse.model_validate({**org.__dict__, "current_role": "org_admin"})


@router.get("/{organization_id}/members", response_model=list[OrganizationMembershipResponse])
def list_org_members(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    deps.ensure_org_permission(organization_id, "org:view", db, current_user)
    rows = (
        db.query(OrganizationMembership, User)
        .join(User, User.id == OrganizationMembership.user_id)
        .filter(OrganizationMembership.organization_id == organization_id)
        .all()
    )
    return [
        OrganizationMembershipResponse(
            id=m.id,
            organization_id=m.organization_id,
            user_id=m.user_id,
            role=m.role,
            created_at=m.created_at,
            email=u.email,
            full_name=u.full_name,
        )
        for m, u in rows
    ]


@router.post("/{organization_id}/invites")
def invite_org_member(
    organization_id: int,
    payload: OrganizationInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    deps.ensure_org_permission(organization_id, "org:invite:create", db, current_user)
    if payload.role.lower() not in {"org_admin", "org_member"}:
        raise HTTPException(status_code=400, detail="Invalid organization role")

    token = secrets.token_urlsafe(32)
    invite = OrganizationInvite(
        organization_id=organization_id,
        email=str(payload.email).lower(),
        role=payload.role.lower(),
        token=token,
        status="pending",
        created_by_user_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    EmailService._fallback_console_email(invite.email, "CloudSentinel Organization Invite", f"Invite token: {token}")
    return {"status": "invited", "token": token}


@router.post("/invites/accept")
def accept_org_invite(
    payload: OrganizationInviteAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    invite = db.query(OrganizationInvite).filter(OrganizationInvite.token == payload.token).first()
    if not invite or invite.status != "pending":
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invite expired")
    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Invite does not belong to this user")

    existing = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.organization_id == invite.organization_id,
            OrganizationMembership.user_id == current_user.id,
        )
        .first()
    )
    if not existing:
        db.add(
            OrganizationMembership(
                organization_id=invite.organization_id,
                user_id=current_user.id,
                role=invite.role,
            )
        )
    invite.status = "accepted"
    db.commit()
    return {"status": "accepted"}
