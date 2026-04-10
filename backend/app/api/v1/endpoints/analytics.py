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
    # Verify project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Total Scans
    total_scans = db.query(Scan).filter(Scan.project_id == project_id).count()

    # Base query for findings in this project
    scan_types = ["CONFIG_UPLOAD", "FILE_SCAN", "DATA_LEAK_SCAN"]
    latest_scan_ids = []
    for stype in scan_types:
        latest = db.query(Scan.id).filter(Scan.project_id == project_id, Scan.scan_type == stype).order_by(Scan.id.desc()).first()
        if latest:
            latest_scan_ids.append(latest.id)
            
    if not latest_scan_ids:
        findings_q = db.query(Finding).filter(False) # Empty query
    else:
        findings_q = db.query(Finding).filter(Finding.scan_id.in_(latest_scan_ids))
        
    total_findings = findings_q.count()

    # Severity Distribution
    severity_distribution = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
    }
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
        # Normalize finding types for UI display if needed, or send as is
        findings_by_type[ftype or "UNKNOWN"] = count

    # Scan Trend (single aggregated query instead of per-scan N+1 counts)
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

    # Single grouped query for finding type counts
    type_count_map = {k: v for k, v in type_counts}
    cloud_misconfig_count = int(type_count_map.get("misconfiguration", 0))
    pii_exposure_count = int(type_count_map.get("pii_exposure", 0))
    malware_count = int(type_count_map.get("malware", 0))
    data_leaks_count = int(type_count_map.get("data_leak", 0))

    critical_incidents_count = db.query(Incident).filter(
        Incident.project_id == project_id,
        Incident.severity == 'CRITICAL'
    ).count()

    # Needing remediation (single aggregate query)
    findings_needing_remediation = (
        findings_q.with_entities(func.count(Finding.id))
        .filter(Finding.recommendation_type.is_not(None))
        .scalar()
        or 0
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
        "critical_incidents_count": critical_incidents_count,
        "findings_needing_remediation": findings_needing_remediation
    }
