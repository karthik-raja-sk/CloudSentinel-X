from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from typing import List
from app.api import deps
from app.models.project import Project

router = APIRouter()

@router.get("/{project_id}", response_model=List[IncidentResponse])
def get_incidents(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    return db.query(Incident).filter(Incident.project_id == project_id).all()
