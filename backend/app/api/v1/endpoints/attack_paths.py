from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.attack_path import AttackPath
from app.models.scan import Scan
from app.schemas.attack_path import AttackPathResponse
from typing import List

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[AttackPathResponse])
def get_project_attack_paths(project_id: int, db: Session = Depends(get_db)):
    latest_scan = db.query(Scan).filter(Scan.project_id == project_id, Scan.scan_type == "CONFIG_UPLOAD").order_by(Scan.id.desc()).first()
    
    if not latest_scan:
        return []
        
    paths = db.query(AttackPath).filter(
        AttackPath.scan_id == latest_scan.id
    ).order_by(AttackPath.risk_score.desc()).all()
    return paths
