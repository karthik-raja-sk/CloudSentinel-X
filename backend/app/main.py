from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.project import Project
from app.models.organization import Organization
from app.models.organization_membership import OrganizationMembership
from app.models.user import User
from app.core.observability import configure_logging, RequestContextMiddleware
import logging

Base.metadata.create_all(bind=engine)
configure_logging()
logger = logging.getLogger(__name__)

if settings.IS_PRODUCTION and settings.SECRET_KEY == "supersecretkey":
    raise RuntimeError("SECRET_KEY must be overridden in production environment")

# Auto-seed default project
db = SessionLocal()
try:
    default_org = db.query(Organization).filter(Organization.id == 1).first()
    if not default_org:
        default_org = Organization(id=1, name="Default Organization")
        db.add(default_org)
        db.commit()

    admin_user = db.query(User).order_by(User.id.asc()).first()
    if admin_user:
        org_membership = db.query(OrganizationMembership).filter(
            OrganizationMembership.organization_id == default_org.id,
            OrganizationMembership.user_id == admin_user.id,
        ).first()
        if not org_membership:
            db.add(OrganizationMembership(organization_id=default_org.id, user_id=admin_user.id, role="org_admin"))
            db.commit()

    if not db.query(Project).filter(Project.id == 1).first():
        db.add(Project(id=1, name="Default Demo Project", organization_id=default_org.id if default_org else None))
        db.commit()
finally:
    db.close()

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(RequestContextMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    # Log the full traceback for the server logs
    logger.exception("unhandled_exception")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

@app.get("/")
def root():
    return {"message": "Welcome to CloudSentinel X API"}
