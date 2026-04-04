from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.project import Project
from typing import Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary/{project_id}")
def get_analytics_summary(project_id: int, db: Session = Depends(get_db)):
    # Verify project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Total Scans
    total_scans = db.query(Scan).filter(Scan.project_id == project_id).count()

    # Base query for findings in this project
    findings_q = db.query(Finding).join(Scan).filter(Scan.project_id == project_id)
    total_findings = findings_q.count()

    # Severity Distribution
    severity_distribution = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
    }
    severity_counts = db.query(Finding.severity, func.count(Finding.id))\
        .join(Scan).filter(Scan.project_id == project_id)\
        .group_by(Finding.severity).all()
        
    for sev, count in severity_counts:
        if sev in severity_distribution:
            severity_distribution[sev] = count

    # Findings by Type
    findings_by_type = {}
    type_counts = db.query(Finding.finding_type, func.count(Finding.id))\
        .join(Scan).filter(Scan.project_id == project_id)\
        .group_by(Finding.finding_type).all()
        
    for ftype, count in type_counts:
        # Normalize finding types for UI display if needed, or send as is
        findings_by_type[ftype or "UNKNOWN"] = count

    # Scan Trend (Last 7 days, or recent scans)
    # Using recent scans for the trend instead of grouping by date for simplicity in SQLite fallback
    recent_scans = db.query(Scan).filter(Scan.project_id == project_id)\
        .order_by(Scan.started_at.desc()).limit(10).all()
        
    scan_trend = []
    # Reverse so oldest is first
    for scan in reversed(recent_scans):
        # Count findings for this scan
        scan_findings_count = db.query(Finding).filter(Finding.scan_id == scan.id).count()
        scan_trend.append({
            "name": scan.started_at.strftime("%Y-%m-%d %H:%M") if scan.started_at else f"Scan {scan.id}",
            "findings": scan_findings_count
        })

    # Cloud Config & PII Exact Counts
    cloud_misconfig_count = db.query(Finding).join(Scan).filter(
        Scan.project_id == project_id,
        Finding.finding_type == 'misconfiguration'
    ).count()

    pii_exposure_count = db.query(Finding).join(Scan).filter(
        Scan.project_id == project_id,
        Finding.finding_type == 'pii_exposure'
    ).count()

    # Needing remediation (Proxy: any finding with recommendation_type mapped)
    findings_needing_remediation = db.query(Finding).join(Scan).filter(
        Scan.project_id == project_id,
        Finding.recommendation_type.is_not(None)
    ).count()

    return {
        "total_scans": total_scans,
        "total_findings": total_findings,
        "severity_distribution": severity_distribution,
        "findings_by_type": findings_by_type,
        "scan_trend": scan_trend,
        "cloud_misconfig_count": cloud_misconfig_count,
        "pii_exposure_count": pii_exposure_count,
        "findings_needing_remediation": findings_needing_remediation
    }
