import json
from typing import List, Dict, Any
from app.models.iam_entity import IamEntity
from sqlalchemy.orm import Session
from datetime import datetime

def parse_iam_entities(file_path: str, project_id: int, scan_id: int, db: Session) -> List[IamEntity]:
    """
    Extracts IAM objects (Users, Roles, Policies) from the configuration file.
    Saves and returns IamEntity models.
    """
    entities = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Simplified parsing assuming a Terraform-like structure or flat list
        raw_resources = []
        if isinstance(data, dict) and "resources" in data:
            for res in data["resources"]:
                instances = res.get("instances", [{}])
                for inst in instances:
                    raw_resources.append({
                        "type": res.get("type"),
                        "name": res.get("name"),
                        "attributes": inst.get("attributes", {})
                    })
        elif isinstance(data, list):
            raw_resources = data
            
        for res in raw_resources:
            res_type = res.get("type", "")
            attrs = res.get("attributes", res.get("config", {}))
            
            if res_type in ["aws_iam_user", "aws_iam_role", "aws_iam_policy"]:
                principal_type = res_type.replace("aws_iam_", "").capitalize()
                
                # Check for inline policies
                inline_policies = attrs.get("inline_policy", [])
                if not isinstance(inline_policies, list):
                    inline_policies = [inline_policies]
                    
                arn = attrs.get("arn", attrs.get("id", f"{principal_type}-{res.get('name')}"))
                    
                entity = IamEntity(
                    project_id=project_id,
                    scan_id=scan_id,
                    principal_type=principal_type,
                    principal_id=arn,
                    principal_name=attrs.get("name", res.get("name", "unknown")),
                    inline_policies=inline_policies,
                    trust_policy=attrs.get("assume_role_policy"),
                    is_human=(principal_type == "User"),
                    created_at=datetime.utcnow()
                )
                
                # Try to extract MFA for users (mocking from config if available)
                if principal_type == "User":
                    entity.mfa_enabled = attrs.get("mfa_active", False)
                    
                db.add(entity)
                entities.append(entity)
                
        db.commit()
        for e in entities:
            db.refresh(e)
            
    except Exception as e:
        print(f"Error parsing IAM entities from {file_path}: {e}")
        
    return entities
