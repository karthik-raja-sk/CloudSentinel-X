from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.scan import Scan
from app.schemas.scan import ScanResponse
from typing import List
from app.core.config import settings
from app.api import deps
from app.models.project import Project
from app.models.user import User
from app.worker.tasks import run_file_scan_task, run_data_leak_scan_task, run_correlation_task


router = APIRouter()

@router.get("/project/{project_id}", response_model=List[ScanResponse])
def get_project_scans(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    scans = db.query(Scan).filter(Scan.project_id == project_id).order_by(Scan.started_at.desc()).all()
    return scans

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan_status(
    scan_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    # BOLA Check: Ensure user has access to the project associated with this scan
    deps.get_project_or_403(scan.project_id, db, current_user)
    
    return scan


@router.post("/{project_id}/files", response_model=ScanResponse)
def trigger_file_scan(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
    _user=Depends(deps.require_minimum_role({"admin", "analyst", "demo_admin", "demo_analyst"})),
):
    scan = Scan(project_id=project_id, status="QUEUED", scan_type="FILE_SCAN")
    db.add(scan)
    db.commit()
    db.refresh(scan)

    if settings.USE_LOCAL_FALLBACK:
        background_tasks.add_task(run_file_scan_task, scan.id, project_id)
    else:
        run_file_scan_task.delay(scan.id, project_id)
    return scan

@router.post("/{project_id}/data-leaks", response_model=ScanResponse)
def trigger_data_leak_scan(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
    _user=Depends(deps.require_minimum_role({"admin", "analyst", "demo_admin", "demo_analyst"})),
):
    scan = Scan(project_id=project_id, status="QUEUED", scan_type="DATA_LEAK_SCAN")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    if settings.USE_LOCAL_FALLBACK:
        background_tasks.add_task(run_data_leak_scan_task, scan.id, project_id)
    else:
        run_data_leak_scan_task.delay(scan.id, project_id)
    return scan

@router.post("/{project_id}/correlate")
def trigger_correlation(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
    _user=Depends(deps.require_minimum_role({"admin", "analyst", "demo_admin", "demo_analyst"})),
):
    if settings.USE_LOCAL_FALLBACK:
        background_tasks.add_task(run_correlation_task, project_id)
    else:
        run_correlation_task.delay(project_id)
    return {"status": "QUEUED", "incidents_created": 0}
