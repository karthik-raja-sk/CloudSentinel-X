from typing import List, Dict, Any
from app.models.asset import Asset
from sqlalchemy.orm import Session

def normalize_assets(parsed_data: List[Dict[str, Any]], project_id: int, db: Session) -> List[Asset]:
    """
    Converts parsed JSON objects into Asset model entries and saves them to DB.
    """

    assets = []
    
    for item in parsed_data:
        asset_type = item.get("type", "unknown")
        resource_name = item.get("name", "unknown")
        config = item.get("config", {})
        
        # Determine region and resource ID
        region = config.get("region") or config.get("aws_region")
        resource_id = config.get("id") or config.get("arn") or f"{asset_type}-{resource_name}"
        
        asset = Asset(
            project_id=project_id,
            asset_type=asset_type,
            resource_id=resource_id,
            resource_name=resource_name,
            region=region,
            criticality="medium",  # Defaulting
            raw_config=config
        )
        db.add(asset)
        assets.append(asset)
        
    db.commit()
    for a in assets:
        db.refresh(a)
        
    return assets
