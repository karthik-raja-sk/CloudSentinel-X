import json
from typing import List, Dict, Any
from app.models.iam_entity import IamEntity
from app.models.finding import Finding
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

# Re-use risk scores from scanner
RISK_SCORES = {
    "CRITICAL": 90,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25
}

def analyze_iam_risks(entities: List[IamEntity], scan_id: int, db: Session) -> List[Finding]:
    findings = []
    
    for entity in entities:
        # Rule 4: MFA disabled for human user
        if entity.is_human and entity.mfa_enabled is False:
            findings.append(Finding(
                scan_id=scan_id,
                iam_entity_id=entity.id,
                finding_type="iam_risk",
                rule_id="IAM_MFA_DISABLED",
                severity="HIGH",
                title="MFA Disabled for Human User",
                description=f"IAM User {entity.principal_name} does not have MFA enabled.",
                resource_id=entity.principal_id,
                evidence=json.dumps({"mfa_enabled": False}),
                risk_score=RISK_SCORES["HIGH"]
            ))
            
        # Rule 5: Risky trust policy allowing broad assume-role access
        if entity.trust_policy:
            try:
                policy = json.loads(entity.trust_policy) if isinstance(entity.trust_policy, str) else entity.trust_policy
                statements = policy.get("Statement", [])
                if not isinstance(statements, list): statements = [statements]
                
                for stmt in statements:
                    if stmt.get("Effect") == "Allow" and stmt.get("Action") in ["sts:AssumeRole", "*"]:
                        principal = stmt.get("Principal", {})
                        if principal == "*" or (isinstance(principal, dict) and principal.get("AWS") == "*"):
                            findings.append(Finding(
                                scan_id=scan_id,
                                iam_entity_id=entity.id,
                                finding_type="iam_risk",
                                rule_id="IAM_RISKY_TRUST_POLICY",
                                severity="CRITICAL",
                                title="Risky Trust Policy (Broad AssumeRole)",
                                description=f"Role {entity.principal_name} can be assumed by anyone (Principal: *).",
                                resource_id=entity.principal_id,
                                evidence=json.dumps(stmt),
                                risk_score=RISK_SCORES["CRITICAL"]
                            ))
            except Exception as e:
                logger.error(f"Failed to parse trust policy for {entity.principal_name}: {e}")

        # Rule 1, 2, 3: Inspect inline (and attached) policies
        # (Assuming attached_policies is optionally parsed similarly to inline)
        policies_to_inspect = []
        if entity.inline_policies:
            policies_to_inspect.extend(entity.inline_policies)
        if entity.attached_policies:
            policies_to_inspect.extend(entity.attached_policies)
            
        for ip in policies_to_inspect:
            try:
                policy = json.loads(ip) if isinstance(ip, str) else ip
                statements = policy.get("Statement", [])
                if not isinstance(statements, list): statements = [statements]
                
                for stmt in statements:
                    if stmt.get("Effect") == "Allow":
                        actions = stmt.get("Action", [])
                        resources = stmt.get("Resource", [])
                        if not isinstance(actions, list): actions = [actions]
                        if not isinstance(resources, list): resources = [resources]
                        
                        action_str = " ".join(actions).lower()
                        
                        # Rule 1: Wildcard Action *
                        if "*" in actions:
                            findings.append(Finding(
                                scan_id=scan_id,
                                iam_entity_id=entity.id,
                                finding_type="iam_risk",
                                rule_id="IAM_WILDCARD_ACTION",
                                severity="CRITICAL",
                                title="Wildcard Action Granted",
                                description=f"Entity {entity.principal_name} has Allow * action.",
                                resource_id=entity.principal_id,
                                evidence=json.dumps(stmt),
                                risk_score=RISK_SCORES["CRITICAL"]
                            ))
                            
                        # Rule 2: Wildcard resource * on write/admin actions
                        if "*" in resources and ("write" in action_str or "admin" in action_str or "put" in action_str or "delete" in action_str or "update" in action_str):
                            findings.append(Finding(
                                scan_id=scan_id,
                                iam_entity_id=entity.id,
                                finding_type="iam_risk",
                                rule_id="IAM_WILDCARD_RESOURCE",
                                severity="HIGH",
                                title="Wildcard Resource on Write/Admin Actions",
                                description=f"Entity {entity.principal_name} has Allow on Resource * with write/admin actions.",
                                resource_id=entity.principal_id,
                                evidence=json.dumps(stmt),
                                risk_score=RISK_SCORES["HIGH"]
                            ))
                            
                        # Rule 3: Admin-style policy attached
                        if "*" in actions and "*" in resources:
                            findings.append(Finding(
                                scan_id=scan_id,
                                iam_entity_id=entity.id,
                                finding_type="iam_risk",
                                rule_id="IAM_ADMIN_POLICY",
                                severity="CRITICAL",
                                title="Admin-Style Policy Attached",
                                description=f"Entity {entity.principal_name} has full admin access (* on *).",
                                resource_id=entity.principal_id,
                                evidence=json.dumps(stmt),
                                risk_score=RISK_SCORES["CRITICAL"]
                            ))
                            
            except Exception as e:
                logger.error(f"Failed to parse inline/attached policy for {entity.principal_name}: {e}")

    for f in findings:
        db.add(f)
        
    db.commit()
    for f in findings:
        db.refresh(f)
        
    return findings
