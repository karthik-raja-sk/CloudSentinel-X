from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from typing import List

router = APIRouter()

@router.get("/{project_id}", response_model=List[IncidentResponse])
def get_incidents(project_id: int, db: Session = Depends(get_db)):
    return db.query(Incident).filter(Incident.project_id == project_id).all()
