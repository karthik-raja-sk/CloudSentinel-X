from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.project import Project
from app.schemas.project import ProjectResponse, ProjectCreate

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.id.asc()).all()
    return projects

@router.post("/", response_model=ProjectResponse)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=project_in.name
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
