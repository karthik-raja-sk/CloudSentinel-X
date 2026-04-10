from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.iam_entity import IamEntity
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.iam import IamEntityResponse
from app.schemas.finding import FindingResponse
from typing import List
from app.api import deps
from app.models.project import Project

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[IamEntityResponse])
def get_project_iam_entities(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "CONFIG_UPLOAD").order_by(Scan.id.desc()).first()
    if not latest_scan:
        return []
    entities = db.query(IamEntity).filter(IamEntity.project_id == project_id, IamEntity.scan_id == latest_scan.id).all()
    return entities

@router.get("/findings/project/{project_id}", response_model=List[FindingResponse])
def get_project_iam_findings(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "CONFIG_UPLOAD").order_by(Scan.id.desc()).first()
    
    if not latest_scan:
        return []
        
    findings = db.query(Finding).filter(
        Finding.scan_id == latest_scan.id,
        Finding.finding_type == "iam_risk"
    ).order_by(Finding.risk_score.desc()).all()
    return findings
