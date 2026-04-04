from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.project import Project

Base.metadata.create_all(bind=engine)

# Auto-seed default project
db = SessionLocal()
try:
    if not db.query(Project).filter(Project.id == 1).first():
        db.add(Project(id=1, name="Default Demo Project"))
        db.commit()
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to CloudSentinel X API"}
