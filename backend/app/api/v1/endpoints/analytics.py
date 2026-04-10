from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.project import Project
from app.models.incident import Incident
from typing import Dict, Any
from app.api import deps

router = APIRouter()

@router.get("/summary/{project_id}")
def get_analytics_summary(
    project_id: int,
    db: Session = Depends(get_db),
    _project: Project = Depends(deps.get_project_or_403),
):
    # Total Scans
    total_scans = db.query(Scan).filter(Scan.project_id == project_id).count()

    # Active Vulnerability Model: Aggregate all OPEN or IN_PROGRESS findings across all scans for this project
    findings_q = (
        db.query(Finding)
        .join(Scan, Scan.id == Finding.scan_id)
        .filter(Scan.project_id == project_id)
        .filter(Finding.remediation_status.in_(["OPEN", "IN_PROGRESS"]))
    )
    total_findings = findings_q.count()

    # Severity Distribution
    severity_distribution = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    severity_counts = findings_q.with_entities(Finding.severity, func.count(Finding.id))\
        .group_by(Finding.severity).all()
        
    for sev, count in severity_counts:
        if sev in severity_distribution:
            severity_distribution[sev] = count

    # Findings by Type
    findings_by_type = {}
    type_counts = findings_q.with_entities(Finding.finding_type, func.count(Finding.id))\
        .group_by(Finding.finding_type).all()
        
    for ftype, count in type_counts:
        findings_by_type[ftype or "UNKNOWN"] = count

    # Scan Trend
    scan_trend_rows = (
        db.query(
            Scan.id,
            Scan.started_at,
            func.count(Finding.id).label("finding_count"),
        )
        .outerjoin(Finding, Finding.scan_id == Scan.id)
        .filter(Scan.project_id == project_id)
        .group_by(Scan.id, Scan.started_at)
        .order_by(Scan.started_at.desc())
        .limit(10)
        .all()
    )
    scan_trend = [
        {
            "name": row.started_at.strftime("%Y-%m-%d %H:%M") if row.started_at else f"Scan {row.id}",
            "findings": int(row.finding_count or 0),
        }
        for row in reversed(scan_trend_rows)
    ]

    type_count_map = {k: v for k, v in type_counts}
    
    # Ensure consistency with frontend keys
    cloud_misconfig_count = int(type_count_map.get("misconfiguration", 0))
    pii_exposure_count = int(type_count_map.get("pii_exposure", 0))
    malware_count = int(type_count_map.get("malware", 0))
    data_leaks_count = int(type_count_map.get("data_leak", 0)) # Fixed key

    critical_incidents_count = db.query(Incident).filter(
        Incident.project_id == project_id,
        Incident.severity == 'CRITICAL'
    ).count()

    findings_needing_remediation = (
        findings_q.filter(Finding.recommendation_type.is_not(None))
        .count()
    )

    return {
        "total_scans": total_scans,
        "total_findings": total_findings,
        "severity_distribution": severity_distribution,
        "findings_by_type": findings_by_type,
        "scan_trend": scan_trend,
        "cloud_misconfig_count": cloud_misconfig_count,
        "pii_exposure_count": pii_exposure_count,
        "malware_count": malware_count,
        "data_leaks_count": data_leaks_count,
        "incident_count": critical_incidents_count, # Aligned with user request
        "critical_incidents_count": critical_incidents_count,
        "findings_needing_remediation": findings_needing_remediation
    }

