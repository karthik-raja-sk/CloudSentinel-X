from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.log_event import LogEvent
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.log import LogEventResponse
from app.schemas.finding import FindingResponse
from typing import List
from app.api import deps
from app.models.project import Project

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[LogEventResponse])
def get_project_log_events(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "CONFIG_UPLOAD").order_by(Scan.id.desc()).first()
    if not latest_scan:
        return []
    events = db.query(LogEvent).filter(LogEvent.project_id == project_id, LogEvent.scan_id == latest_scan.id).all()
    return events

@router.get("/findings/project/{project_id}", response_model=List[FindingResponse])
def get_project_log_findings(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "CONFIG_UPLOAD").order_by(Scan.id.desc()).first()
    
    if not latest_scan:
        return []
        
    findings = db.query(Finding).filter(
        Finding.scan_id == latest_scan.id,
        Finding.finding_type == "log_threat"
    ).order_by(Finding.risk_score.desc()).all()
    return findings
