from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.scan import Scan
from app.schemas.scan import ScanResponse
from typing import List

from app.services.scanners.file_scanner import scan_files as run_file_scan
from app.services.scanners.data_leak_detector import scan_data_leaks as run_data_leak_scan
from app.services.analyzers.risk_correlation_engine import run_correlation

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

@router.post("/{project_id}/files", response_model=ScanResponse)
def trigger_file_scan(project_id: int, db: Session = Depends(get_db)):
    scan = Scan(project_id=project_id, status="COMPLETED", scan_type="FILE_SCAN")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    run_file_scan(scan.id, project_id, db)
    return scan

@router.post("/{project_id}/data-leaks", response_model=ScanResponse)
def trigger_data_leak_scan(project_id: int, db: Session = Depends(get_db)):
    scan = Scan(project_id=project_id, status="COMPLETED", scan_type="DATA_LEAK_SCAN")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    run_data_leak_scan(scan.id, project_id, db)
    return scan

@router.post("/{project_id}/correlate")
def trigger_correlation(project_id: int, db: Session = Depends(get_db)):
    incidents = run_correlation(project_id, db)
    return {"status": "SUCCESS", "incidents_created": len(incidents)}
