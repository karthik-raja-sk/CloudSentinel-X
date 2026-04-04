import json
from typing import List, Dict, Any
from app.models.asset import Asset
from app.models.iam_entity import IamEntity
from app.models.log_event import LogEvent
from app.models.finding import Finding
from app.models.attack_path import AttackPath
from sqlalchemy.orm import Session
from datetime import datetime

# Risk scoring for attack paths
RISK_SCORES = {
    "CRITICAL": 90,
    "HIGH": 75,
    "MEDIUM": 50
}

def generate_attack_paths(
    assets: List[Asset], 
    iam_entities: List[IamEntity], 
    log_events: List[LogEvent], 
    findings: List[Finding], 
    scan_id: int, 
    project_id: int, 
    db: Session
) -> List[AttackPath]:
    
    attack_paths = []
    
    # Identify key findings
    public_findings = [f for f in findings if "PUBLIC" in f.rule_id]
    admin_iam_findings = [f for f in findings if "ADMIN" in f.rule_id or "WILDCARD" in f.rule_id]
    iam_weakness_findings = [f for f in findings if "MFA" in f.rule_id or "TRUST" in f.rule_id]
    secret_findings = [f for f in findings if f.finding_type == "secret"]
    suspicious_ip_findings = [f for f in findings if "SUSPICIOUS_IP" in f.rule_id]
    failed_login_burst_findings = [f for f in findings if "FAILED_LOGIN" in f.rule_id or "BRUTE_FORCE" in f.rule_id]
    
    # Lookups
    asset_map = {str(a.id): a for a in assets}
    iam_map = {str(i.id): i for i in iam_entities}

    # Rule 1: Public Asset → IAM Escalation
    if public_findings and admin_iam_findings:
        pf = public_findings[0]
        af = admin_iam_findings[0]
        
        asset = asset_map.get(str(pf.asset_id))
        iam = iam_map.get(str(af.iam_entity_id))
        
        if asset and iam:
            nodes = [
                {"type": "external_actor", "id": "internet", "label": "External Attacker"},
                {"type": "asset", "id": str(asset.resource_id), "label": asset.resource_name or str(asset.resource_id)},
                {"type": "iam_entity", "id": str(iam.principal_id), "label": iam.principal_name or str(iam.principal_id)}
            ]
            edges = [
                {"from": "internet", "to": str(asset.resource_id), "relation": "reaches"},
                {"from": str(asset.resource_id), "to": str(iam.principal_id), "relation": "enables_access_to"}
            ]
            
            attack_paths.append(AttackPath(
                project_id=project_id, scan_id=scan_id,
                title="[PATH_PUBLIC_ASSET_IAM_ESCALATION] Public Asset to IAM Privilege Escalation",
                description="External attacker can access a publicly exposed asset and pivot to an overprivileged IAM entity.",
                severity="CRITICAL", risk_score=RISK_SCORES["CRITICAL"],
                path_nodes=nodes, path_edges=edges,
                created_at=datetime.utcnow()
            ))

    # Rule 2: IAM Weakness → Secret Exposure
    if iam_weakness_findings and secret_findings:
        iwf = iam_weakness_findings[0]
        sf = secret_findings[0]
        iam = iam_map.get(str(iwf.iam_entity_id))
        
        if iam:
            nodes = [
                {"type": "iam_entity", "id": str(iam.principal_id), "label": iam.principal_name or str(iam.principal_id)},
                {"type": "secret", "id": str(sf.id), "label": "Exposed Credential"}
            ]
            edges = [
                {"from": str(iam.principal_id), "to": str(sf.id), "relation": "compromises"}
            ]
            
            attack_paths.append(AttackPath(
                project_id=project_id, scan_id=scan_id,
                title="[PATH_IAM_TO_SECRET_EXPOSURE] IAM Weakness to Secret Exposure",
                description="An IAM entity with weak configuration can be compromised, leading to secret exposure.",
                severity="HIGH", risk_score=RISK_SCORES["HIGH"],
                path_nodes=nodes, path_edges=edges,
                created_at=datetime.utcnow()
            ))

    # Rule 3: Key Creation → Privileged Action
    key_creates = [e for e in log_events if e.event_name == "CreateAccessKey"]
    priv_actions = [e for e in log_events if e.event_name in ["AttachRolePolicy", "PutRolePolicy", "AttachUserPolicy"]]
    
    for kc in key_creates:
        for pa in priv_actions:
            if kc.principal_id == pa.principal_id and kc.event_time and pa.event_time and kc.event_time < pa.event_time:
                nodes = [
                    {"type": "log_event", "id": str(kc.id), "label": "Credential Creation"},
                    {"type": "iam_entity", "id": str(kc.principal_id), "label": "Compromised Principal"},
                    {"type": "log_event", "id": str(pa.id), "label": "Privilege Escalation"}
                ]
                edges = [
                    {"from": str(kc.id), "to": str(kc.principal_id), "relation": "enables"},
                    {"from": str(kc.principal_id), "to": str(pa.id), "relation": "performs"}
                ]
                attack_paths.append(AttackPath(
                    project_id=project_id, scan_id=scan_id,
                    title="[PATH_KEY_TO_PRIVILEGED_ACTION] Privilege Escalation via New Access Key",
                    description="A newly created access key was used to perform a privileged action.",
                    severity="CRITICAL", risk_score=RISK_SCORES["CRITICAL"],
                    path_nodes=nodes, path_edges=edges,
                    created_at=datetime.utcnow()
                ))
                break 

    # Rule 4: Failed Login Burst → Successful Action
    if failed_login_burst_findings:
        login_fails = [e for e in log_events if e.event_name == "ConsoleLogin" and e.response_status == "failure"]
        login_success = [e for e in log_events if e.event_name == "ConsoleLogin" and e.response_status == "success"]
        
        fails_by_ip = {}
        for f_evt in login_fails:
            if f_evt.source_ip:
                fails_by_ip[f_evt.source_ip] = fails_by_ip.get(f_evt.source_ip, 0) + 1
            
        for ip, count in fails_by_ip.items():
            if count >= 3:
                success = next((s for s in login_success if s.source_ip == ip), None)
                if success:
                    nodes = [
                        {"type": "ip", "id": ip, "label": "Attacker IP"},
                        {"type": "iam_entity", "id": str(success.principal_id), "label": "Compromised Account"}
                    ]
                    edges = [
                        {"from": ip, "to": str(success.principal_id), "relation": "brute_forces"}
                    ]
                    attack_paths.append(AttackPath(
                        project_id=project_id, scan_id=scan_id,
                        title="[PATH_BRUTE_FORCE_TO_SUCCESS] Brute Force to Compromise",
                        description=f"IP {ip} performed a burst of failed logins followed by a successful login.",
                        severity="CRITICAL", risk_score=RISK_SCORES["CRITICAL"],
                        path_nodes=nodes, path_edges=edges,
                        created_at=datetime.utcnow()
                    ))
                    break

    # Rule 5: Public Asset → Suspicious IP Activity
    if public_findings and suspicious_ip_findings:
        pf = public_findings[0]
        sif = suspicious_ip_findings[0]
        asset = asset_map.get(str(pf.asset_id))
        
        suspicious_ip = json.loads(sif.evidence).get("ip", "Unknown IP") if sif.evidence else "Unknown IP"
        
        if asset:
            nodes = [
                {"type": "ip", "id": suspicious_ip, "label": "Suspicious External IP"},
                {"type": "asset", "id": str(asset.resource_id), "label": asset.resource_name or str(asset.resource_id)}
            ]
            edges = [
                {"from": suspicious_ip, "to": str(asset.resource_id), "relation": "accesses"}
            ]
            
            attack_paths.append(AttackPath(
                project_id=project_id, scan_id=scan_id,
                title="[PATH_PUBLIC_ASSET_SUSPICIOUS_IP] External Exposure and Suspicious Activity",
                description="A public asset exists alongside suspicious API activity from a non-private IP.",
                severity="MEDIUM", risk_score=RISK_SCORES["MEDIUM"],
                path_nodes=nodes, path_edges=edges,
                created_at=datetime.utcnow()
            ))

    for path in attack_paths:
        db.add(path)
        
    db.commit()
    for path in attack_paths:
        db.refresh(path)
        
    return attack_paths
