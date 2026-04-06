from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan import Scan
from app.schemas.finding import FindingResponse
from typing import List

router = APIRouter()

@router.get("/{project_id}", response_model=List[FindingResponse])
def get_data_leak_findings(project_id: int, db: Session = Depends(get_db)):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "DATA_LEAK_SCAN").order_by(Scan.id.desc()).first()
    if not latest_scan:
        return []
    return db.query(Finding).filter(
        Finding.scan_id == latest_scan.id,
        Finding.finding_type == "data_leak"
    ).all()
