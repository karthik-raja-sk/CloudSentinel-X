from datetime import timedelta, datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema
from app.services.audit_service import AuditService
from app.services.email_service import EmailService
from app.schemas.token import Token, TokenPayload
from pydantic import BaseModel, ValidationError
from jose import jwt, JWTError
import uuid
from collections import defaultdict
from threading import Lock

FAILED_LOGIN_TRACKER: dict[str, list[datetime]] = defaultdict(list)
FAILED_LOGIN_LOCK = Lock()
MAX_FAILED_LOGINS = 5
FAILED_LOGIN_WINDOW_MINUTES = 10

router = APIRouter()

class VerifyTokenRequest(BaseModel):
    token: str

class EmailRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class DemoLoginRequest(BaseModel):
    role: str

def generate_refresh_token_and_set_cookie(response: Response, user: User, db: Session):
    refresh_token_id = str(uuid.uuid4())
    refresh_token = security.create_refresh_token(user.id, refresh_token_id)
    
    user.refresh_token_id = refresh_token_id
    user.last_login = datetime.utcnow()
    db.commit()
    
    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    response.set_cookie(
        key="cloudsentinel_refresh",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set locally False due to HTTP limitation, require True during SaaS deployment.
        samesite="lax",
        expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
    )

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(deps.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    ip = request.client.host if request.client else None
    identity_key = f"{form_data.username}:{ip}"
    now = datetime.utcnow()
    with FAILED_LOGIN_LOCK:
        recent = [
            ts for ts in FAILED_LOGIN_TRACKER.get(identity_key, [])
            if ts >= now - timedelta(minutes=FAILED_LOGIN_WINDOW_MINUTES)
        ]
        FAILED_LOGIN_TRACKER[identity_key] = recent
        if len(recent) >= MAX_FAILED_LOGINS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Try again later.",
            )
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        with FAILED_LOGIN_LOCK:
            FAILED_LOGIN_TRACKER[identity_key].append(now)
        AuditService.log(db, "login_failed", "failure", email=form_data.username, ip_address=ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not verified")

    generate_refresh_token_and_set_cookie(response, user, db)
    with FAILED_LOGIN_LOCK:
        FAILED_LOGIN_TRACKER.pop(identity_key, None)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    AuditService.log(db, "login_success", "success", user_id=user.id, email=user.email, role=user.role, ip_address=ip)

    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
@limiter.limit("20/minute")
def refresh_token(request: Request, response: Response, db: Session = Depends(deps.get_db)):
    ip = request.client.host if request.client else None
    token = request.cookies.get("cloudsentinel_refresh")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        AuditService.log(db, "refresh_failed", "failure", ip_address=ip, message="Invalid token structure")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if token_data.type != "refresh" or not token_data.rti or not token_data.sub:
        AuditService.log(db, "refresh_failed", "failure", ip_address=ip, message="Invalid refresh token claims")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
            
    target_user = db.query(User).filter(User.refresh_token_id == token_data.rti).first()
            
    if not target_user or str(target_user.id) != str(token_data.sub):
        AuditService.log(db, "refresh_failed", "failure", ip_address=ip, message="Token revoked or user missing")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    # Rotate
    generate_refresh_token_and_set_cookie(response, target_user, db)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    AuditService.log(db, "refresh_issued", "success", user_id=target_user.id, email=target_user.email, role=target_user.role, ip_address=ip)
    
    return {
        "access_token": security.create_access_token(
            target_user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    current_user.refresh_token_id = None
    db.commit()
    response.delete_cookie("cloudsentinel_refresh")
    AuditService.log(db, "logout", "success", user_id=current_user.id, email=current_user.email, role=current_user.role, ip_address=request.client.host if request.client else None)
    return {"msg": "Successfully logged out"}

@router.post("/demo-login", response_model=Token)
@limiter.limit("20/minute")
def demo_login(
    request: Request, req: DemoLoginRequest, response: Response, db: Session = Depends(deps.get_db)
):
    ip = request.client.host if request.client else None
    if req.role not in ["Admin", "Analyst", "Viewer"]:
        raise HTTPException(status_code=400, detail="Invalid demo role")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # We do not issue HTTP cookies for demo user, just standard fast-tracked short token
    AuditService.log(db, "demo_login", "success", role=req.role, ip_address=ip)
    
    return {
        "access_token": security.create_access_token(
            req.role, expires_delta=access_token_expires
        ),
        "token_type": "bearer"
    }

@router.post("/register", response_model=UserSchema)
@limiter.limit("5/minute")
def register(
    request: Request,
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    verification_token = secrets.token_urlsafe(32)
    
    user_obj = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=security.get_password_hash(user_in.password),
        role="analyst",
        verification_token=verification_token,
        verification_token_expiry=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    
    EmailService.send_verification_email(email=user_obj.email, token=verification_token)
    AuditService.log(db, "registration", "success", user_id=user_obj.id, email=user_obj.email, role="analyst", ip_address=ip)
    
    return user_obj

@router.post("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, req: VerifyTokenRequest, db: Session = Depends(deps.get_db)):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.verification_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if user.verification_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token expired")
        
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expiry = None
    db.commit()
    AuditService.log(db, "email_verified", "success", user_id=user.id, email=user.email, role=user.role, ip_address=ip)
    return {"msg": "Email verified successfully"}

@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, req: EmailRequest, db: Session = Depends(deps.get_db)):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"msg": "If the email is registered, a verification link has been sent."}
    if user.is_verified:
        return {"msg": "User is already verified"}
        
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.verification_token_expiry = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    
    EmailService.send_verification_email(email=user.email, token=verification_token)
    AuditService.log(db, "resend_verification", "success", user_id=user.id, email=user.email, role=user.role, ip_address=ip)
    return {"msg": "Verification email resent"}

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, req: EmailRequest, db: Session = Depends(deps.get_db)):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"msg": "If the email is registered, a password reset link has been sent."}
        
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    EmailService.send_reset_password_email(email=user.email, token=reset_token)
    AuditService.log(db, "password_reset_requested", "success", user_id=user.id, email=user.email, role=user.role, ip_address=ip)
    return {"msg": "Password reset email sent"}

@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(deps.get_db)):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    if user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token expired")
        
    user.hashed_password = security.get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    AuditService.log(db, "password_reset_completed", "success", user_id=user.id, email=user.email, role=user.role, ip_address=ip)
    return {"msg": "Password reset successfully"}

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(deps.get_current_active_user)):
    return current_user

@router.get("/audit", dependencies=[Depends(deps.RoleChecker(["admin", "demo_admin"]))])
def get_audit_logs(
    db: Session = Depends(deps.get_db),
    event_type: str | None = None,
    status: str | None = None,
    role: str | None = None,
    email: str | None = None,
    ip_address: str | None = None,
    page: int = 1,
    page_size: int = 50
):
    from app.models.audit_log import AuditLog
    
    query = db.query(AuditLog)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if status:
        query = query.filter(AuditLog.status == status)
    if role:
        query = query.filter(AuditLog.role == role)
    if email:
        query = query.filter(AuditLog.email.ilike(f"%{email}%"))
    if ip_address:
        query = query.filter(AuditLog.ip_address.ilike(f"%{ip_address}%"))
        
    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
