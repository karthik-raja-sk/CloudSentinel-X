from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.finding import FindingResponse
from typing import List, Optional

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[FindingResponse])
def get_project_findings(project_id: int, type: Optional[str] = None, db: Session = Depends(get_db)):
    scan_types = ["CONFIG_UPLOAD", "FILE_SCAN", "DATA_LEAK_SCAN"]
    latest_scan_ids = []
    for stype in scan_types:
        latest = db.query(Scan.id).filter(Scan.project_id == project_id, Scan.scan_type == stype).order_by(Scan.id.desc()).first()
        if latest:
            latest_scan_ids.append(latest.id)
            
    if not latest_scan_ids:
        return []
        
    query = db.query(Finding).filter(Finding.scan_id.in_(latest_scan_ids))
    if type:
        query = query.filter(Finding.finding_type == type)
        
    findings = query.order_by(Finding.risk_score.desc()).all()
    return findings

from pydantic import BaseModel

class RemediationUpdate(BaseModel):
    status: str

@router.patch("/{finding_id}/status", response_model=FindingResponse)
def update_remediation_status(finding_id: int, payload: RemediationUpdate, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    finding.remediation_status = payload.status
    db.commit()
    db.refresh(finding)
    return finding
