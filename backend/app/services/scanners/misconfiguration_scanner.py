from typing import List
from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.models.finding import Finding
import json

# Define risk scores
RISK_SCORES = {
    "CRITICAL": 90,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25
}

def check_public_s3(asset: Asset) -> Finding | None:
    if asset.asset_type != "aws_s3_bucket": return None
    config = asset.raw_config
    acl = config.get("acl", "")
    policy = str(config.get("policy", ""))
    
    if acl in ["public-read", "public-read-write"] or "PublicRead" in policy or "Allow\"*\"" in policy.replace(" ", ""):
        return Finding(
            rule_id="S3_PUBLIC_ACCESS",
            severity="CRITICAL",
            title="Public S3 Bucket",
            description="The S3 bucket allows public access via ACL or Policy.",
            resource_id=asset.resource_id,
            remediation="Remove public ACLs and restrict bucket policies to known identities.",
            evidence=json.dumps({"acl": acl, "policy_sample": policy[:100]}),
            risk_score=RISK_SCORES["CRITICAL"],
            recommendation_type="STORAGE_LOCKDOWN",
            remediation_text="Immediately remove 'public-read' ACLs. Apply 'Block Public Access' (BPA) strictly at the account or bucket level."
        )
    return None

def check_ssh_open(asset: Asset) -> Finding | None:
    if asset.asset_type != "aws_security_group": return None
    config = asset.raw_config
    ingress = config.get("ingress", [])
    if not isinstance(ingress, list): return None
    
    for rule in ingress:
        from_port = rule.get("from_port")
        to_port = rule.get("to_port")
        cidr = rule.get("cidr_blocks", [])
        if from_port <= 22 <= to_port and "0.0.0.0/0" in cidr:
            return Finding(
                rule_id="SG_SSH_OPEN",
                severity="HIGH",
                title="SSH Open to World",
                description="Security group allows SSH (port 22) from all IPs.",
                resource_id=asset.resource_id,
                remediation="Restrict SSH access to corporate IP ranges.",
                evidence=json.dumps(rule),
                risk_score=RISK_SCORES["HIGH"],
                recommendation_type="NETWORK_ISOLATION",
                remediation_text="Modify Security Group Ingress rules. Drop '0.0.0.0/0' targeting port 22. Limit to explicit VPN/Bastion CIDRs."
            )
    return None

def check_rdp_open(asset: Asset) -> Finding | None:
    if asset.asset_type != "aws_security_group": return None
    config = asset.raw_config
    ingress = config.get("ingress", [])
    if not isinstance(ingress, list): return None
    
    for rule in ingress:
        from_port = rule.get("from_port")
        to_port = rule.get("to_port")
        cidr = rule.get("cidr_blocks", [])
        if from_port <= 3389 <= to_port and "0.0.0.0/0" in cidr:
            return Finding(
                rule_id="SG_RDP_OPEN",
                severity="HIGH",
                title="RDP Open to World",
                description="Security group allows RDP (port 3389) from all IPs.",
                resource_id=asset.resource_id,
                remediation="Restrict RDP access to a bastion host or corporate VPN.",
                evidence=json.dumps(rule),
                risk_score=RISK_SCORES["HIGH"],
                recommendation_type="NETWORK_ISOLATION",
                remediation_text="Modify Security Group Ingress rules. Drop '0.0.0.0/0' targeting port 3389. Disable direct remote access."
            )
    return None

def check_public_db(asset: Asset) -> Finding | None:
    if asset.asset_type != "aws_db_instance": return None
    config = asset.raw_config
    publicly_accessible = config.get("publicly_accessible", False)
    
    if publicly_accessible:
        return Finding(
            rule_id="RDS_PUBLIC_ACCESS",
            severity="CRITICAL",
            title="Public Database Instance",
            description="The RDS database is publicly accessible.",
            resource_id=asset.resource_id,
            remediation="Set publicly_accessible to false and place the DB in private subnets.",
            evidence=json.dumps({"publicly_accessible": publicly_accessible}),
            risk_score=RISK_SCORES["CRITICAL"],
            recommendation_type="NETWORK_ISOLATION",
            remediation_text="Migrate RDS instance to Private Subnets. Toggle `publicly_accessible=False` safely."
        )
    return None

def check_encryption_disabled(asset: Asset) -> Finding | None:
    # Check EBS or RDS or S3 for encryption
    config = asset.raw_config
    if asset.asset_type in ["aws_ebs_volume", "aws_db_instance"]:
        encrypted = config.get("encrypted", False)
        if not encrypted:
            return Finding(
                rule_id="ENCRYPTION_DISABLED",
                severity="MEDIUM",
                title="Storage Encryption Disabled",
                description=f"Encryption at rest is not enabled for {asset.asset_type}.",
                resource_id=asset.resource_id,
                remediation="Enable encryption using AWS KMS.",
                evidence=json.dumps({"encrypted": encrypted}),
                risk_score=RISK_SCORES["MEDIUM"],
                recommendation_type="ENCRYPTION_REST",
                remediation_text="Halt instances temporarily to convert volumes to Encrypted snapshots. Ensure Default KMS Key usage is mandated natively."
            )
    
    # Check S3 specifically if configured inside bucket options
    if asset.asset_type == "aws_s3_bucket":
        enc_config = config.get("server_side_encryption_configuration", {})
        if not enc_config:
            return Finding(
                rule_id="S3_ENCRYPTION_DISABLED",
                severity="MEDIUM",
                title="S3 Default Encryption Disabled",
                description="Default bucket encryption is not enabled.",
                resource_id=asset.resource_id,
                remediation="Enable SSE-S3 or SSE-KMS for the bucket.",
                evidence=json.dumps({"encryption": "None"}),
                risk_score=RISK_SCORES["MEDIUM"],
                recommendation_type="ENCRYPTION_REST",
                remediation_text="Activate SSE-S3 natively. It adds zero direct cost while establishing minimum baseline security layers."
            )
    return None


def run_scanner(assets: List[Asset], scan_id: int, db: Session) -> List[Finding]:
    """
    Runs the 5 misconfiguration rules against the normalized assets.
    Saves Findings to DB.
    """
    rules = [
        check_public_s3,
        check_ssh_open,
        check_rdp_open,
        check_public_db,
        check_encryption_disabled
    ]
    
    findings = []
    
    for asset in assets:
        for rule in rules:
            finding = rule(asset)
            if finding:
                finding.scan_id = scan_id
                finding.asset_id = asset.id
                db.add(finding)
                findings.append(finding)
                
    db.commit()
    for f in findings:
        db.refresh(f)
        
    return findings
