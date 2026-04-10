from sqlalchemy.orm import Session
from app.models.finding import Finding
from app.models.scan import Scan
from app.models.incident import Incident

def run_correlation(project_id: int, db: Session):
    scan_types = ["CONFIG_UPLOAD", "FILE_SCAN", "DATA_LEAK_SCAN"]
    latest_scan_ids = []
    for stype in scan_types:
        latest = db.query(Scan.id).filter(Scan.project_id == project_id, Scan.scan_type == stype).order_by(Scan.id.desc()).first()
        if latest:
            latest_scan_ids.append(latest.id)
            
    if not latest_scan_ids:
        findings = []
    else:
        findings = db.query(Finding).filter(Finding.scan_id.in_(latest_scan_ids)).all()
    
    # 1. Malware + Data Leak Pattern
    if has_malware and has_data_leak:
        resources = list(set([f.resource_id for f in findings if f.finding_type in ['malware', 'data_leak']]))
        create_incident_if_new(
            db, project_id, incidents_created,
            "CRITICAL: Active Malware in Sensitive Data Storage",
            "CRITICAL",
            "An attacker could use malware to exfiltrate unredacted PII or credentials found in the same storage context.",
            "Remove malicious files, rotate any potential leaks, and enable zero-trust access controls.",
            resources
        )

    # 2. Public Bucket + Exposure Pattern
    if has_misconfigured_str and (has_data_leak or has_malware):
        resources = list(set([f.resource_id for f in findings if (f.finding_type == 'misconfiguration' and 'public' in str(f.title).lower()) or f.finding_type in ['data_leak', 'malware']]))
        create_incident_if_new(
            db, project_id, incidents_created,
            "CRITICAL: Public Exposure of Sensitive Assets",
            "CRITICAL",
            "Public access allows anonymous actors to discover and download PII, secrets, or malicious payloads.",
            "Immediately disable public access (Block Public Access) and audit access logs for unauthorized downloads.",
            resources
        )

    # 3. Identity Over-permission + Secret Leak Pattern (NEW)
    has_wildcard_iam = any(f.finding_type == 'iam_risk' and 'Wildcard' in str(f.title) for f in findings)
    has_secret = any(f.finding_type == 'secret' for f in findings)
    if has_wildcard_iam and has_secret:
        resources = list(set([f.resource_id for f in findings if f.finding_type in ['iam_risk', 'secret']]))
        create_incident_if_new(
            db, project_id, incidents_created,
            "HIGH: Over-privileged Identity with Leaked Secrets",
            "HIGH",
            "A principal with wildcard permissions has access to leaked secrets, creating a high risk of lateral movement.",
            "Restrict IAM policies to least-privilege and rotate the leaked secrets found in the code/logs.",
            resources
        )

    return incidents_created

def create_incident_if_new(db: Session, project_id: int, created_list: list, title: str, severity: str, path: str, rec: str, resources: list):
    # Deduplicate against existing incidents for this project with the same title
    existing = db.query(Incident).filter(
        Incident.project_id == project_id, 
        Incident.title == title,
        Incident.status != 'RESOLVED'
    ).first()
    
    if not existing:
        incident = Incident(
            project_id=project_id,
            title=title,
            severity=severity,
            affected_resources=resources,
            attack_path=path,
            recommendation=rec,
            status="OPEN"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        created_list.append(incident)
