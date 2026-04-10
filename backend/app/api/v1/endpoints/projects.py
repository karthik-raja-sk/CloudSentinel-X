from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.project import Project
from app.models.user import User
from app.models.project_membership import ProjectMembership
from app.models.organization_membership import OrganizationMembership
from app.schemas.project import ProjectResponse, ProjectCreate
from app.schemas.project_membership import (
    ProjectMembershipInvite,
    ProjectMembershipResponse,
    ProjectMembershipRoleUpdate,
)
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: int | None = None,
):
    role = (current_user.role or "").lower()
    
    # Superusers and Demo roles see all projects
    if current_user.is_superuser or role.startswith("demo_"):
        query = db.query(Project)
        if organization_id is not None:
            query = query.filter(Project.organization_id == organization_id)
            
        projects = query.order_by(Project.id.asc()).all()
        for p in projects:
            p.current_role = "admin"
        return projects
        
    # Standard users see projects they are members of
    # Optimization: Use a single JOIN query to fetch projects and roles
    results = (
        db.query(Project, ProjectMembership.role)
        .join(ProjectMembership, ProjectMembership.project_id == Project.id)
        .filter(ProjectMembership.user_id == current_user.id)
    )
    
    if organization_id is not None:
        results = results.filter(Project.organization_id == organization_id)
        
    results = results.order_by(Project.id.asc()).all()
    
    projects = []
    for p, pm_role in results:
        p.current_role = pm_role
        projects.append(p)
        
    return projects


@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_minimum_role({"admin", "analyst", "demo_admin", "demo_analyst"})),
):
    org_id = project_in.organization_id
    if org_id:
        deps.ensure_org_permission(org_id, "project:create", db, current_user)
    else:
        # Try to infer organization if only one membership exists, otherwise require explicit ID
        memberships = db.query(OrganizationMembership).filter(OrganizationMembership.user_id == current_user.id).all()
        if len(memberships) == 1:
            org_id = memberships[0].organization_id
        elif len(memberships) > 1:
            raise HTTPException(
                status_code=400, 
                detail="Multiple organizations found. Please specify organization_id explicitly."
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Organization context missing. You must create or join an organization first."
            )

    project = Project(
        name=project_in.name,
        owner_id=current_user.id if not current_user.is_superuser else current_user.id,
        organization_id=org_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    membership = ProjectMembership(
        user_id=current_user.id,
        project_id=project.id,
        role="admin",
    )
    db.add(membership)
    db.commit()
    project.current_role = "admin"
    return project


@router.get("/{project_id}/members", response_model=List[ProjectMembershipResponse])
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    _project=Depends(deps.get_project_or_403),
):
    members = (
        db.query(ProjectMembership, User)
        .join(User, User.id == ProjectMembership.user_id)
        .filter(ProjectMembership.project_id == project_id)
        .order_by(ProjectMembership.created_at.asc())
        .all()
    )
    return [
        ProjectMembershipResponse(
            id=m.id,
            user_id=m.user_id,
            project_id=m.project_id,
            role=m.role,
            created_at=m.created_at,
            email=u.email,
            full_name=u.full_name,
        )
        for m, u in members
    ]


@router.post("/{project_id}/members", response_model=ProjectMembershipResponse)
def invite_project_member(
    project_id: int,
    payload: ProjectMembershipInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _ = deps.get_project_or_403(project_id, db, current_user)
    admin_membership = deps.get_project_membership_or_403(project_id, db, current_user)
    if admin_membership.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only project admin can manage members")

    target_user = db.query(User).filter(User.email == payload.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role.lower() not in {"admin", "analyst", "viewer"}:
        raise HTTPException(status_code=400, detail="Invalid project role")

    exists = (
        db.query(ProjectMembership)
        .filter(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == target_user.id,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="User is already a project member")

    member = ProjectMembership(
        project_id=project_id,
        user_id=target_user.id,
        role=payload.role.lower(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return ProjectMembershipResponse(
        id=member.id,
        user_id=member.user_id,
        project_id=member.project_id,
        role=member.role,
        created_at=member.created_at,
        email=target_user.email,
        full_name=target_user.full_name,
    )


@router.patch("/{project_id}/members/{user_id}", response_model=ProjectMembershipResponse)
def update_project_member_role(
    project_id: int,
    user_id: int,
    payload: ProjectMembershipRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _ = deps.get_project_or_403(project_id, db, current_user)
    admin_membership = deps.get_project_membership_or_403(project_id, db, current_user)
    if admin_membership.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only project admin can manage members")

    if payload.role.lower() not in {"admin", "analyst", "viewer"}:
        raise HTTPException(status_code=400, detail="Invalid project role")

    membership = (
        db.query(ProjectMembership)
        .filter(ProjectMembership.project_id == project_id, ProjectMembership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    membership.role = payload.role.lower()
    db.commit()
    db.refresh(membership)
    target_user = db.query(User).filter(User.id == user_id).first()
    return ProjectMembershipResponse(
        id=membership.id,
        user_id=membership.user_id,
        project_id=membership.project_id,
        role=membership.role,
        created_at=membership.created_at,
        email=target_user.email if target_user else None,
        full_name=target_user.full_name if target_user else None,
    )


@router.delete("/{project_id}/members/{user_id}")
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _ = deps.get_project_or_403(project_id, db, current_user)
    admin_membership = deps.get_project_membership_or_403(project_id, db, current_user)
    if admin_membership.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only project admin can manage members")

    membership = (
        db.query(ProjectMembership)
        .filter(ProjectMembership.project_id == project_id, ProjectMembership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    if membership.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Project admin cannot remove themselves")

    db.delete(membership)
    db.commit()
    return {"status": "removed"}
