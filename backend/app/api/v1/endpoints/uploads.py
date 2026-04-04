from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.upload import Upload
from app.models.scan import Scan
from app.schemas.upload import UploadResponse
from app.worker.tasks import run_scan_task
import os
import shutil
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

from app.core.config import settings

@router.post("/{project_id}", response_model=UploadResponse)
def upload_config(project_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Save file locally
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_path = os.path.join(UPLOAD_DIR, f"{project_id}_{timestamp}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Create Upload record
    upload = Upload(
        project_id=project_id,
        filename=file.filename,
        s3_key=file_path # Using s3_key to store local path for V1
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    # 3. Create Scan record (QUEUED)
    scan = Scan(
        project_id=project_id,
        status="QUEUED",
        scan_type="CONFIG_UPLOAD"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # 4. Trigger Celery Task or Local Background Task
    if settings.USE_LOCAL_FALLBACK:
        background_tasks.add_task(run_scan_task, scan.id)
    else:
        run_scan_task.delay(scan.id)
    
    return UploadResponse(
        upload_id=upload.id,
        scan_id=scan.id,
        status=str(scan.status)
    )
