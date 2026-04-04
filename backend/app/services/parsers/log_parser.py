import json
from typing import List, Dict, Any
from app.models.log_event import LogEvent
from sqlalchemy.orm import Session
from datetime import datetime

def parse_log_events(file_path: str, project_id: int, scan_id: int, db: Session) -> List[LogEvent]:
    # Extracts CloudTrail or audit style events
    events = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            data = json.load(f)
            
        raw_records = []
        if isinstance(data, dict) and "Records" in data:
            raw_records = data["Records"]
        elif isinstance(data, list):
            raw_records = data
            
        for rec in raw_records:
            if not isinstance(rec, dict): continue
            
            # Identify standard CloudTrail or generic log fields
            event_time = rec.get("eventTime", rec.get("timestamp", ""))
            source_service = rec.get("eventSource", rec.get("source", "unknown"))
            event_name = rec.get("eventName", rec.get("action", "unknown"))
            
            # Extract principal
            user_id = rec.get("userIdentity", {})
            principal_id = user_id.get("arn", user_id.get("principalId", "unknown"))
            if isinstance(user_id, str): principal_id = user_id
            
            # Net info
            source_ip = rec.get("sourceIPAddress", rec.get("ip", "unknown"))
            user_agent = rec.get("userAgent", "")
            region = rec.get("awsRegion", rec.get("region", ""))
            
            # Response
            error_code = rec.get("errorCode", "")
            response_status = "failure" if error_code else "success"
            
            # Basic filtering for actual events
            if event_name != "unknown":
                log_evt = LogEvent(
                    project_id=project_id,
                    scan_id=scan_id,
                    event_time=event_time,
                    source_service=source_service,
                    event_name=event_name,
                    principal_id=principal_id,
                    source_ip=source_ip,
                    user_agent=user_agent,
                    region=region,
                    response_status=response_status,
                    error_code=error_code,
                    raw_event=rec,
                    created_at=datetime.utcnow()
                )
                db.add(log_evt)
                events.append(log_evt)
                
        db.commit()
        for e in events:
            db.refresh(e)
            
    except Exception as e:
        print(f"Error parsing logs from {file_path}: {e}")
        
    return events
