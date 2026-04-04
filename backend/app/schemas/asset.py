from pydantic import BaseModel
from typing import Optional, Any

class AssetResponse(BaseModel):
    id: int
    asset_type: str
    resource_id: str
    resource_name: Optional[str] = None
    region: Optional[str] = None
    criticality: Optional[str] = None

    class Config:
        from_attributes = True
