from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.attack_path import AttackPath
from app.models.scan import Scan
from app.schemas.attack_path import AttackPathResponse
from typing import List
from app.api import deps
from app.models.project import Project

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[AttackPathResponse])
def get_project_attack_paths(
    project_id: int,
    scan_id: int | None = None,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    if scan_id:
        scan = db.query(Scan).filter(Scan.id == scan_id, Scan.project_id == project_id).first()
    else:
        scan = db.query(Scan).filter(
            Scan.project_id == project_id, 
            Scan.scan_type == "CONFIG_UPLOAD",
            Scan.status == "COMPLETED"
        ).order_by(Scan.id.desc()).first()
    
    if not scan:
        return []
        
    paths = db.query(AttackPath).filter(
        AttackPath.scan_id == scan.id
    ).order_by(AttackPath.risk_score.desc()).all()
    return paths
