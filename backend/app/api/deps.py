from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.project_membership import ProjectMembership
from app.models.organization_membership import OrganizationMembership
from app.core.permissions import has_project_permission, has_org_permission
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
READ_ROLES = {"admin", "analyst", "viewer", "demo_admin", "demo_analyst", "demo_viewer"}
WRITE_ROLES = {"admin", "analyst", "demo_admin", "demo_analyst"}
PROJECT_ROLES = {"admin", "analyst", "viewer"}

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if token_data.type and token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if token_data.sub in ["Admin", "Analyst", "Viewer"]:
        # Mock user for demo mode
        demo_role = f"demo_{token_data.sub.lower()}"
        return User(
            id=9999,
            email=f"demo_{token_data.sub.lower()}@cloudsentinel.example.com",
            role=demo_role,
            is_active=True,
            is_superuser=(token_data.sub == "Admin"),
            is_verified=True,
            full_name=f"Demo {token_data.sub}"
        )

    try:
        user_id = int(token_data.sub) if token_data.sub is not None else None
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

from app.services.audit_service import AuditService
from fastapi import Request

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, request: Request, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        allowed = {r.lower() for r in self.allowed_roles}
        if current_user.role.lower() not in allowed and not current_user.is_superuser:
            AuditService.log(
                db=db,
                event_type="unauthorized_access_attempt",
                status="failure",
                user_id=current_user.id,
                email=current_user.email,
                role=current_user.role,
                ip_address=request.client.host if request.client else None,
                message=f"Attempted to access '{request.url.path}' requiring {self.allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges."
            )
        return current_user


def require_minimum_role(allowed_roles: set[str]):
    def _checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_superuser:
            return current_user
        if current_user.role.lower() not in {r.lower() for r in allowed_roles}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges.",
            )
        return current_user
    return _checker


def get_project_or_403(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    role = (current_user.role or "").lower()
    if current_user.is_superuser or role.startswith("demo_"):
        return project

    membership = (
        db.query(ProjectMembership)
        .filter(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Project access denied")
    return project


def get_project_membership_or_403(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ProjectMembership:
    role = (current_user.role or "").lower()
    if current_user.is_superuser or role.startswith("demo_"):
        return ProjectMembership(
            id=0,
            user_id=current_user.id,
            project_id=project_id,
            role="admin",
        )

    membership = (
        db.query(ProjectMembership)
        .filter(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Project access denied")
    return membership


def require_project_role(project_id: int, allowed_roles: set[str]):
    def _checker(
        membership: ProjectMembership = Depends(get_project_membership_or_403),
    ) -> ProjectMembership:
        if membership.role.lower() not in {r.lower() for r in allowed_roles}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient project role privileges.",
            )
        return membership
    return _checker


def get_org_membership_or_403(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OrganizationMembership:
    role = (current_user.role or "").lower()
    if current_user.is_superuser or role.startswith("demo_"):
        return OrganizationMembership(
            id=0,
            organization_id=organization_id,
            user_id=current_user.id,
            role="org_admin",
        )
    membership = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.organization_id == organization_id,
            OrganizationMembership.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Organization access denied")
    return membership


def ensure_project_permission(project_id: int, permission: str, db: Session, current_user: User) -> None:
    role = (current_user.role or "").lower()
    if current_user.is_superuser or role.startswith("demo_"):
        return
    membership = (
        db.query(ProjectMembership)
        .filter(ProjectMembership.project_id == project_id, ProjectMembership.user_id == current_user.id)
        .first()
    )
    if not membership or not has_project_permission(membership.role, permission):
        raise HTTPException(status_code=403, detail="Insufficient project permissions")


def ensure_org_permission(organization_id: int, permission: str, db: Session, current_user: User) -> None:
    role = (current_user.role or "").lower()
    if current_user.is_superuser or role.startswith("demo_"):
        return
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == organization_id, OrganizationMembership.user_id == current_user.id)
        .first()
    )
    if not membership or not has_org_permission(membership.role, permission):
        raise HTTPException(status_code=403, detail="Insufficient organization permissions")
