from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.finding import FindingResponse
from typing import List, Optional
from app.api import deps
from app.models.project import Project
from app.models.user import User

router = APIRouter()

from sqlalchemy import func

@router.get("/project/{project_id}", response_model=List[FindingResponse])
def get_project_findings(
    project_id: int,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    # Active Vulnerability Model: Fetch all findings currently in OPEN or IN_PROGRESS status across all project scans
    query = (
        db.query(Finding)
        .join(Scan, Scan.id == Finding.scan_id)
        .filter(Scan.project_id == project_id)
        .filter(Finding.remediation_status.in_(["OPEN", "IN_PROGRESS"]))
    )
    if type:
        query = query.filter(Finding.finding_type == type)
        
    findings = query.order_by(Finding.risk_score.desc()).all()
    return findings


from pydantic import BaseModel

class RemediationUpdate(BaseModel):
    status: str

@router.patch("/{finding_id}/status", response_model=FindingResponse)
def update_remediation_status(
    finding_id: int,
    payload: RemediationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_minimum_role({"admin", "analyst", "demo_admin", "demo_analyst"})),
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    scan = db.query(Scan).filter(Scan.id == finding.scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Parent scan not found")
    deps.get_project_or_403(scan.project_id, db, current_user)

    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    finding.remediation_status = payload.status
    db.commit()
    db.refresh(finding)
    return finding
