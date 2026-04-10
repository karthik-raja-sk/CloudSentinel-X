import re
from typing import List
from app.models.finding import Finding
from sqlalchemy.orm import Session

# Re-use risk scores
RISK_SCORES = {
    "CRITICAL": 90,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25
}

SECRET_PATTERNS = {
    "AWS_ACCESS_KEY": re.compile(r"(?i)(AKIA[0-9A-Z]{16})"),
    "AWS_SECRET_KEY": re.compile(r"(?i)(?<=aws_secret_access_key=)[0-9a-zA-Z/+]{40}|(?<=aws_secret_key=)[0-9a-zA-Z/+]{40}"),
    "GITHUB_TOKEN": re.compile(r"(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghc_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36})"),
    "BEARER_TOKEN": re.compile(r"(?i)(?:bearer)\s+([a-zA-Z0-9_\-\.]{20,})"),
    "DB_CONNECTION_STRING": re.compile(r"(?i)(?:postgres|mysql|mongodb.*)://[^:]+:([^@]+)@[^:]+:\d+/"),
    "GENERIC_PASSWORD": re.compile(r"(?i)(?:password|passwd|pwd)\s*[:=]\s*[\"']?([a-zA-Z0-9_\-\.\!\@\#\$\%\^\&\*]{8,})[\"']?")
}

def scan_file_for_secrets(file_path: str, scan_id: int, db: Session) -> List[Finding]:
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:            
            for line_num, line in enumerate(f, 1):
                for secret_type, pattern in SECRET_PATTERNS.items():
                    matches = pattern.findall(line)
                    for match in matches:
                        # Always extract strings, fallback safely if tuples remain
                        matched_string = match[-1] if isinstance(match, tuple) else match
                        if not matched_string: continue
                        
                        masked_val = matched_string[:4] + "*" * (len(matched_string)-4) if len(matched_string) > 4 else "****"
                        
                        findings.append(Finding(
                            scan_id=scan_id,
                            finding_type="secret",
                            rule_id=f"SECRET_{secret_type}",
                            severity="CRITICAL",
                            title=f"Hardcoded {secret_type.replace('_', ' ').title()} Found",
                            description=f"A possible secret was found in the configuration limits.",
                            resource_id="Uploaded_File",
                            remediation="Remove the secret and use a secure vault or parameter store.",
                            evidence=f"Line {line_num}: Secret found.",
                            risk_score=RISK_SCORES["CRITICAL"],
                            recommendation_type="ROTATE_IMMEDIATELY",
                            remediation_text="Never store secrets in plaintext. Rotate immediately and inject via CI/CD secrets manager.",
                            sample_masked_value=masked_val
                        ))
                    
    except Exception as e:
        print(f"Error scanning for secrets in {file_path}: {e}")

    for f in findings:
        db.add(f)
        
    db.commit()
    for f in findings:
        db.refresh(f)
        
    return findings
