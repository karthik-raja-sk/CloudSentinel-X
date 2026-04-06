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
    
    has_malware = any(f.finding_type == 'malware' for f in findings)
    has_data_leak = any(f.finding_type == 'data_leak' for f in findings)
    # Check if there is an existing misconfiguration involving storage or public access
    has_misconfigured_str = any(f.finding_type == 'misconfiguration' and 'public' in str(f.title).lower() for f in findings)
    
    incidents_created = []

    # Correlate
    if has_malware and (has_data_leak or has_misconfigured_str):
        severity = "CRITICAL"
        title = "CRITICAL: Malware co-exists with Data Leaks or Public Misconfigurations"
        attack_path = "Attacker accesses public resources, discovers leaked credentials, and executes malware to pivot internally."
        recommendation = "1) Immediately quarantine malware. 2) Rotate leaked secrets. 3) Restrict public access."
    elif has_data_leak and has_misconfigured_str:
        severity = "CRITICAL"
        title = "CRITICAL: Public File Contains PII or Secrets"
        attack_path = "Public exposure directly exposes unredacted PII and/or API Keys to the open internet."
        recommendation = "Block public access immediately and rotate secrets."
    elif has_malware:
        severity = "HIGH"
        title = "HIGH: Malware found in Storage"
        attack_path = "Malicious executable could be triggered by internal processes or unaware users."
        recommendation = "Remove execution permissions and delete malicious files."
    elif has_data_leak:
        severity = "HIGH"
        title = "HIGH: Sensitive Data Exposure (PII / Secrets)"
        attack_path = "Internal users or compromised accounts could harvest plaintext sensitive data."
        recommendation = "Redact sensitive data from storage and rotate compromised keys."
    else:
        return incidents_created # No new incident generated from correlation

    # Deduplicate logic: check if this incident type already exists for project
    existing = db.query(Incident).filter(Incident.project_id == project_id, Incident.title == title).first()
    
    if not existing:
        incident = Incident(
            project_id=project_id,
            title=title,
            severity=severity,
            affected_resources=["datasets/s3_bucket"],
            attack_path=attack_path,
            recommendation=recommendation
        )
        db.add(incident)
        incidents_created.append(incident)
        db.commit()
    
    return incidents_created
