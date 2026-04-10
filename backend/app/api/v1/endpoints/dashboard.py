from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api import deps
from app.models.project import Project
from app.models.project_membership import ProjectMembership
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api import deps
from app.models.project import Project
from app.models.project_membership import ProjectMembership
from app.models.finding import Finding
from app.models.scan import Scan
from app.models.user import User

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Find all project IDs the user belongs to
    project_ids = [m.project_id for m in db.query(ProjectMembership).filter(ProjectMembership.user_id == current_user.id).all()]
    
    if not project_ids:
        return {
            "total_projects": 0,
            "critical_findings": 0,
            "malware_count": 0,
            "data_leaks_count": 0,
            "incident_count": 0,
            "recent_scans": []
        }

    total_projects = len(project_ids)
    
    # Active Vulnerability Aggregation: OPEN or IN_PROGRESS findings across all projects
    active_findings_q = (
        db.query(Finding)
        .join(Scan, Scan.id == Finding.scan_id)
        .filter(Scan.project_id.in_(project_ids))
        .filter(Finding.remediation_status.in_(["OPEN", "IN_PROGRESS"]))
    )
    
    critical_findings_count = active_findings_q.filter(Finding.severity.ilike("critical")).count()
    malware_count = active_findings_q.filter(Finding.finding_type == "malware").count()
    data_leaks_count = active_findings_q.filter(Finding.finding_type == "data_leak").count()
    
    from app.models.incident import Incident
    incident_count = (
        db.query(Incident)
        .filter(Incident.project_id.in_(project_ids))
        .count()
    )
    
    # Get 5 most recent scans across all projects
    recent_scans = (
        db.query(Scan)
        .filter(Scan.project_id.in_(project_ids))
        .order_by(Scan.started_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_projects": total_projects,
        "critical_findings": critical_findings_count,
        "malware_count": malware_count,
        "data_leaks_count": data_leaks_count,
        "incident_count": incident_count,
        "recent_scans": recent_scans
    }
