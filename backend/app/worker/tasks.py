from app.worker.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.scan import Scan
from app.models.upload import Upload
from app.models.finding import Finding
from app.services.parsers.config_parser import parse_config
from app.services.normalizers.asset_normalizer import normalize_assets
from app.services.scanners.misconfiguration_scanner import run_scanner
from app.services.parsers.iam_parser import parse_iam_entities
from app.services.analyzers.iam_risk_analyzer import analyze_iam_risks
from app.services.scanners.secrets_detector import scan_file_for_secrets
from app.services.parsers.log_parser import parse_log_events
from app.services.analyzers.log_threat_analyzer import analyze_log_threats
from app.services.analyzers.attack_path_engine import generate_attack_paths
from app.services.scanners.pii_detector import scan_file_for_pii
from app.services.scanners.file_scanner import scan_files as run_file_scan
from app.services.scanners.data_leak_detector import scan_data_leaks as run_data_leak_scan
from app.services.analyzers.risk_correlation_engine import run_correlation
from datetime import datetime
import traceback

@celery_app.task(name="run_scan")
def run_scan_task(scan_id: int):
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan: return
        
        scan.status = "RUNNING"
        db.commit()
        
        upload = db.query(Upload).filter(Upload.project_id == scan.project_id).order_by(Upload.id.desc()).first()
        if not upload or not upload.s3_key:
            raise Exception("No file available for scan")
            
        file_path = upload.s3_key
        
        # 1. Parse configs & Normalize assets
        parsed_data = parse_config(file_path)
        assets = normalize_assets(parsed_data, scan.project_id, db)
        
        # 2. Run misconfiguration scanner
        run_scanner(assets, scan.id, db)
        
        # 3. Parse IAM entities & Run IAM Analyzer
        iam_entities = parse_iam_entities(file_path, scan.project_id, scan.id, db)
        analyze_iam_risks(iam_entities, scan.id, db)

        # 4. Run Secrets Detector on raw file
        scan_file_for_secrets(file_path, scan.id, db)
        
        # 4b. Run PII Detector on raw file
        scan_file_for_pii(file_path, scan.id, db)
        
        # 5. Parse Logs & Run Log Threat Analyzer
        log_events = parse_log_events(file_path, scan.project_id, scan.id, db)
        if log_events:
            analyze_log_threats(log_events, scan.id, db)
            
        # 6. Generate Attack Paths
        # Fetch all findings for this scan to correlate 
        findings = db.query(Finding).filter(Finding.scan_id == scan.id).all()
        generate_attack_paths(assets, iam_entities, log_events, findings, scan.id, scan.project_id, db)
        
        # Complete
        scan.status = "COMPLETED"
        scan.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        db.rollback()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "FAILED"
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            db.commit()
        print(f"Task failed: {traceback.format_exc()}")
    finally:
        db.close()


@celery_app.task(name="run_file_scan")
def run_file_scan_task(scan_id: int, project_id: int):
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id, Scan.project_id == project_id).first()
        if not scan:
            return
        scan.status = "RUNNING"
        db.commit()
        run_file_scan(scan_id, project_id, db)
        scan.status = "COMPLETED"
        scan.error_message = None
        scan.completed_at = datetime.utcnow()
        db.commit()
    except Exception as exc:
        db.rollback()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "FAILED"
            scan.error_message = str(exc)[:500]
            scan.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@celery_app.task(name="run_data_leak_scan")
def run_data_leak_scan_task(scan_id: int, project_id: int):
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id, Scan.project_id == project_id).first()
        if not scan:
            return
        scan.status = "RUNNING"
        db.commit()
        run_data_leak_scan(scan_id, project_id, db)
        scan.status = "COMPLETED"
        scan.error_message = None
        scan.completed_at = datetime.utcnow()
        db.commit()
    except Exception as exc:
        db.rollback()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "FAILED"
            scan.error_message = str(exc)[:500]
            scan.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@celery_app.task(name="run_correlation")
def run_correlation_task(project_id: int):
    db = SessionLocal()
    try:
        run_correlation(project_id, db)
    finally:
        db.close()
