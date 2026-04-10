import os
import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.finding import Finding

# Regex Patterns for data leaks
PATTERNS = {
    "Email": r'([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    "Phone": r'(?:\+\d{1,2}\s?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}',
    "Aadhaar": r'\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b',
    "AWS API Key": r'AKIA[0-9A-Z]{16}',
    "Password": r'PASSWORD\s*=\s*([^\s]+)'
}

def mask_value(match_type: str, value: str) -> str:
    """Masks sensitive values before storing them in DB."""
    if not value: return value
    
    if match_type == "Email":
        parts = value.split('@')
        if len(parts) == 2:
            return f"{parts[0][:2]}***@{parts[1]}"
    elif match_type == "Phone":
        return f"***-***-{value[-4:]}"
    elif match_type == "Aadhaar":
        return f"****-****-{value[-4:]}"
    elif match_type == "AWS API Key":
        return f"AKIA{'*' * 12}{value[-4:]}"
    elif match_type == "Password":
        return "*********"
        
    return value[:2] + "***"

def scan_data_leaks(scan_id: int, project_id: int, db: Session, target_dir: str = None):
    if target_dir is None:
        # Avoid scanning hardcoded folders by default; scan only what's passed
        return findings
        
    findings = []
    
    if not os.path.exists(target_dir):
        print(f"Dataset path {target_dir} not found!")
        return findings

    for root, _, files in os.walk(target_dir):
        for file in files:
            filepath = os.path.join(root, file)
            _, ext = os.path.splitext(file)
            
            if ext.lower() not in {'.txt', '.csv', '.json', '.log', '.bat'}:
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for line_num, line in enumerate(lines, 1):
                    for leak_type, pattern in PATTERNS.items():
                        matches = re.finditer(pattern, line)
                        for match in matches:
                            raw_value = match.group(1) if len(match.groups()) > 0 else match.group(0)
                            masked_val = mask_value(leak_type, raw_value)
                            
                            severity = "CRITICAL" if leak_type in ["AWS API Key", "Password"] else "HIGH"
                            
                            finding = Finding(
                                scan_id=scan_id,
                                finding_type="data_leak",
                                title=f"Data Leak: {leak_type}",
                                description=f"Found sensitive {leak_type} pattern",
                                severity=severity,
                                resource_id=filepath,
                                risk_score=95 if severity == "CRITICAL" else 80,
                                raw_data={
                                    "scanner_name": "CloudSentinel Data Leak Detector",
                                    "detection_method": "Regex Matching",
                                    "matched_pattern": leak_type,
                                    "file_name": file,
                                    "resource_path": filepath,
                                    "line_number": line_num,
                                    "matched_value": masked_val,
                                    "detected_at": datetime.now().isoformat()
                                }
                            )
                            db.add(finding)
                            findings.append(finding)
            except Exception:
                pass # Skip files that cannot be read as utf-8
                
    db.commit()
    return findings
