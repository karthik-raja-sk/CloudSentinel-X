from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.log_event import LogEvent
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.log import LogEventResponse
from app.schemas.finding import FindingResponse
from typing import List

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[LogEventResponse])
def get_project_log_events(project_id: int, db: Session = Depends(get_db)):
    events = db.query(LogEvent).filter(LogEvent.project_id == project_id).all()
    return events

@router.get("/findings/project/{project_id}", response_model=List[FindingResponse])
def get_project_log_findings(project_id: int, db: Session = Depends(get_db)):
    scans = db.query(Scan.id).filter(Scan.project_id == project_id).all()
    scan_ids = [s.id for s in scans]
    
    if not scan_ids:
        return []
        
    findings = db.query(Finding).filter(
        Finding.scan_id.in_(scan_ids),
        Finding.finding_type == "log_threat"
    ).order_by(Finding.risk_score.desc()).all()
    return findings
