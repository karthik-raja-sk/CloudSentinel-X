import os
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.finding import Finding

MALICIOUS_EXTENSIONS = {'.exe', '.dll', '.bat', '.js', '.sh', '.bin'}

def get_file_hash(filepath: str) -> str:
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for block in iter(lambda: f.read(4096), b''):
                sha256.update(block)
        return sha256.hexdigest()
    except Exception:
        return "ERROR_READING_FILE"

def scan_files(scan_id: int, project_id: int, db: Session, target_dir: str = None):
    if target_dir is None:
        target_dir = "../datasets/s3_bucket" if os.path.exists("../datasets/s3_bucket") else "datasets/s3_bucket"
        
    findings = []
    
    if not os.path.exists(target_dir):
        print(f"Dataset path {target_dir} not found!")
        return findings

    for root, _, files in os.walk(target_dir):
        for file in files:
            filepath = os.path.join(root, file)
            _, ext = os.path.splitext(file)
            ext = ext.lower()
            
            is_malicious = False
            reason = ""
            risk_level = "LOW"
            
            # Extension check
            if ext in MALICIOUS_EXTENSIONS:
                is_malicious = True
                reason = f"Suspicious executable extension '{ext}' detected"
                risk_level = "HIGH"
            
            # EICAR or known mock signature check
            file_hash = get_file_hash(filepath)
            # EICAR hash is just an example, we could also check if hash == "..."
            # Reading basic file content for mock signature
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read(100) # Read first 100 chars
                    if "EICAR-STANDARD-ANTIVIRUS-TEST-FILE" in content:
                        is_malicious = True
                        reason = "Known malware signature (EICAR) detected"
                        risk_level = "CRITICAL"
            except Exception:
                pass
            
            if is_malicious:
                finding = Finding(
                    scan_id=scan_id,
                    finding_type="malware",
                    title=f"Malware Found: {file}",
                    description=reason,
                    severity=risk_level,
                    resource_id=filepath,
                    risk_score=90 if risk_level == "CRITICAL" else 75,
                    raw_data={
                        "scanner_name": "CloudSentinel File Scanner",
                        "detection_method": "Signature & Extension Match",
                        "matched_pattern": reason,
                        "file_name": file,
                        "file_path": filepath,
                        "file_hash": file_hash,
                        "extension": ext,
                        "scanned_at": datetime.now().isoformat()
                    }
                )
                db.add(finding)
                findings.append(finding)
                
    db.commit()
    return findings
