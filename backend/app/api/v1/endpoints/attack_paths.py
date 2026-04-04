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
    scans = db.query(Scan.id).filter(Scan.project_id == project_id).all()
    scan_ids = [s.id for s in scans]
    
    if not scan_ids:
        return []
        
    paths = db.query(AttackPath).filter(
        AttackPath.scan_id.in_(scan_ids)
    ).order_by(AttackPath.risk_score.desc()).all()
    return paths
