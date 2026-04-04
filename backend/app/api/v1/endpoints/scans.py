from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.scan import Scan
from app.schemas.scan import ScanResponse
from typing import List

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[ScanResponse])
def get_project_scans(project_id: int, db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.project_id == project_id).order_by(Scan.started_at.desc()).all()
    return scans

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan_status(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan
