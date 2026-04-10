from pydantic import BaseModel, ConfigDict
from typing import Optional, Any

class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_type: str
    resource_id: str
    resource_name: Optional[str] = None
    region: Optional[str] = None
    criticality: Optional[str] = None
