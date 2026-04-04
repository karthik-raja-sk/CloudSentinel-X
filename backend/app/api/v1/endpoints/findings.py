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
    scans = db.query(Scan.id).filter(Scan.project_id == project_id).all()
    scan_ids = [s.id for s in scans]
    
    if not scan_ids:
        return []
        
    query = db.query(Finding).filter(Finding.scan_id.in_(scan_ids))
    if type:
        query = query.filter(Finding.finding_type == type)
        
    findings = query.order_by(Finding.risk_score.desc()).all()
    return findings
