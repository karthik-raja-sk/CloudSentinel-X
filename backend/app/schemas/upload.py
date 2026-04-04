from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadResponse(BaseModel):
    upload_id: int
    scan_id: int
    status: str
