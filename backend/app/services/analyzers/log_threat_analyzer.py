import json
from typing import List, Dict
from app.models.log_event import LogEvent
from app.models.finding import Finding
from sqlalchemy.orm import Session
from datetime import datetime

RISK_SCORES = {
    "CRITICAL": 90,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25
}

def analyze_log_threats(events: List[LogEvent], scan_id: int, db: Session) -> List[Finding]:
    findings = []
    
    # 1. State tracking for bursts and behavioral correlations
    failed_logins: Dict[str, int] = {}
    delete_activity: Dict[str, int] = {}
    recent_new_keys: Dict[str, bool] = {} # Tracks principal_id who just made a key
    
    for evt in events:
        # Rule 1: Failed login attempts (ConsoleLogin)
        if evt.event_name == "ConsoleLogin" and evt.response_status == "failure":
            count = failed_logins.get(evt.source_ip, 0) + 1
            failed_logins[evt.source_ip] = count
            if count == 5: # Threshold for burst (simple V1 logic)
                findings.append(Finding(
                    scan_id=scan_id,
                    finding_type="log_threat",
                    rule_id="LOG_FAILED_LOGIN_BURST",
                    severity="HIGH",
                    title="Multiple Failed Logins",
                    description=f"Multiple failed ConsoleLogin attempts from IP {evt.source_ip}.",
                    resource_id=evt.source_ip,
                    evidence=json.dumps({"ip": evt.source_ip, "failures": count}),
                    risk_score=RISK_SCORES["HIGH"]
                ))
                
        # Prep for Rule 2: Access Key Creation
        if evt.event_name == "CreateAccessKey":
            recent_new_keys[evt.principal_id] = True
            
        # Rule 2 check: privileged action after key creation
        if recent_new_keys.get(evt.principal_id, False) and evt.event_name in ["CreateUser", "AttachUserPolicy", "AttachRolePolicy", "PutRolePolicy"]:
            findings.append(Finding(
                scan_id=scan_id,
                finding_type="log_threat",
                rule_id="LOG_ACCESS_KEY_ESCALATION",
                severity="CRITICAL",
                title="Suspicious Privileged Action Following Key Creation",
                description=f"Principal {evt.principal_id} performed {evt.event_name} shortly after creating an access key.",
                resource_id=evt.principal_id,
                evidence=json.dumps({"event": evt.event_name}),
                risk_score=RISK_SCORES["CRITICAL"]
            ))
            # reset to prevent spam
            recent_new_keys[evt.principal_id] = False

        # Rule 3: Unusual delete activity burst
        if evt.event_name.startswith("Delete"):
            count = delete_activity.get(evt.principal_id, 0) + 1
            delete_activity[evt.principal_id] = count
            if count == 10: # Threshold
                findings.append(Finding(
                    scan_id=scan_id,
                    finding_type="log_threat",
                    rule_id="LOG_DELETE_BURST",
                    severity="MEDIUM",
                    title="Delete Activity Burst",
                    description=f"Principal {evt.principal_id} initiated a high volume of Delete API calls.",
                    resource_id=evt.principal_id,
                    evidence=json.dumps({"event": evt.event_name, "count": count}),
                    risk_score=RISK_SCORES["MEDIUM"]
                ))
                
        # Rule 4: Suspicious access from unknown/public IP
        # (Very naive V1 implementation: flagging if IP doesn't start with 10. or 192.168 or 172.16 -> meaning public, on sensitive events)
        if evt.source_ip and not evt.source_ip.startswith(("10.", "192.168.", "172.16.", "127.", "unknown")):
            if "Describe" not in evt.event_name and "List" not in evt.event_name and "Get" not in evt.event_name:
                # Modifying state from a public IP
                findings.append(Finding(
                    scan_id=scan_id,
                    finding_type="log_threat",
                    rule_id="LOG_SUSPICIOUS_IP_ACCESS",
                    severity="MEDIUM",
                    title="State Modification from Public IP",
                    description=f"Action {evt.event_name} called from non-private IP {evt.source_ip}.",
                    resource_id=evt.principal_id,
                    evidence=json.dumps({"ip": evt.source_ip, "event": evt.event_name}),
                    risk_score=RISK_SCORES["MEDIUM"]
                ))
                
        # Rule 5: Policy change event
        if evt.event_name in ["PutBucketPolicy", "AttachRolePolicy", "PutRolePolicy", "AttachUserPolicy", "PutUserPolicy"]:
            findings.append(Finding(
                scan_id=scan_id,
                finding_type="log_threat",
                rule_id="LOG_POLICY_CHANGE",
                severity="HIGH",
                title="Security Policy Modified",
                description=f"Principal {evt.principal_id} modified a security policy ({evt.event_name}).",
                resource_id=evt.principal_id,
                evidence=json.dumps({"event": evt.event_name}),
                risk_score=RISK_SCORES["HIGH"]
            ))
            
        # Rule 6: Secret access event
        if evt.event_name in ["GetSecretValue", "Decrypt"] and evt.source_service in ["secretsmanager.amazonaws.com", "kms.amazonaws.com"]:
            findings.append(Finding(
                scan_id=scan_id,
                finding_type="log_threat",
                rule_id="LOG_SECRET_ACCESS",
                severity="MEDIUM",
                title="Sensitive Data / Secret Accessed",
                description=f"Principal {evt.principal_id} accessed a secret or decrypted data via {evt.source_service}.",
                resource_id=evt.principal_id,
                evidence=json.dumps({"event": evt.event_name}),
                risk_score=RISK_SCORES["MEDIUM"]
            ))

    # Add findings to DB
    for f in findings:
        db.add(f)
        
    db.commit()
    for f in findings:
        db.refresh(f)
        
    return findings
