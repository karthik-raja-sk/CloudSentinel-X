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

# Advanced PII Patterns tailored for high-risk configurations
PII_PATTERNS = {
    "EMAIL": re.compile(r"([a-zA-Z0-9_\-\.\+]+@[a-zA-Z0-9_\-\.]+\.[a-zA-Z]{2,})"),
    "PHONE_NUMBER": re.compile(r"(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}"),
    "CREDIT_CARD": re.compile(r"(?:\d[ -]*?){13,16}"),
    "AADHAAR": re.compile(r"^\d{4}\s\d{4}\s\d{4}$"),
    "PAN_CARD": re.compile(r"[A-Z]{5}[0-9]{4}[A-Z]{1}")
}

def mask_pii(value: str, type: str) -> str:
    """Safely masks string outputs for database persistence to avoid storing actual PII"""
    try:
        value = str(value).strip()
        if type == "EMAIL":
            parts = value.split('@')
            return f"{parts[0][:2]}****@{parts[1]}"
        elif type == "PHONE_NUMBER":
            return f"{value[:-4]}****"
        elif type in ["CREDIT_CARD", "AADHAAR"]:
            clean_val = re.sub(r'[\s-]', '', value)
            return f"****-****-****-{clean_val[-4:]}"
        elif type == "PAN_CARD":
            return f"{value[:2]}*****{value[-2:]}"
        return "****"
    except:
        return "******** (Auto-Masked)"

def get_remediation(type: str) -> dict:
    if type == "EMAIL":
        return {
            "type": "MASKING_REQUIRED",
            "text": "Mask email address to partial visibility (e.g. ka****@gmail.com) in logs and UI outputs."
        }
    elif type in ["CREDIT_CARD", "AADHAAR", "PAN_CARD"]:
        return {
            "type": "TOKENIZATION_REQUIRED",
            "text": "Highly sensitive PII detected. Retain only last 4 digits visually. Consider tokenization infrastructure via API."
        }
    else:
        return {
            "type": "PARTIAL_HIDING",
            "text": "Hide at least 60% of identifying attributes before persisting to data warehouses."
        }

def scan_file_for_pii(file_path: str, scan_id: int, db: Session) -> List[Finding]:
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        for line_num, line in enumerate(lines, 1):
            for pii_type, pattern in PII_PATTERNS.items():
                # Avoid overlapping regex bounds where generic numbers match PAN rules accidentally
                matches = pattern.findall(line)
                for match in matches:
                    matched_string = match[0] if isinstance(match, tuple) else match
                    if not matched_string or len(matched_string.strip()) < 5: continue
                    
                    # Sanitize generic numbers crossing into Credit Card rules inherently
                    if pii_type == "CREDIT_CARD" and len(re.sub(r'\D', '', matched_string)) < 13:
                        continue
                    
                    masked_val = mask_pii(matched_string, pii_type)
                    remedy = get_remediation(pii_type)
                    
                    findings.append(Finding(
                        scan_id=scan_id,
                        finding_type="pii_exposure",
                        rule_id=f"PII_{pii_type}",
                        severity="HIGH",
                        title=f"Exposed {pii_type.replace('_', ' ').title()} Data Found",
                        description=f"Raw Personally Identifiable Information identified in structural inputs.",
                        resource_id="Uploaded_File",
                        evidence=f"Line {line_num}: Data snippet identified.",
                        remediation=remedy["text"], # Legacy
                        recommendation_type=remedy["type"],
                        remediation_text=remedy["text"],
                        sample_masked_value=masked_val,
                        risk_score=RISK_SCORES["HIGH"]
                    ))
                    
    except Exception as e:
        print(f"Error scanning for PII in {file_path}: {e}")

    for f in findings:
        db.add(f)
        
    db.commit()
    for f in findings:
        db.refresh(f)
        
    return findings
