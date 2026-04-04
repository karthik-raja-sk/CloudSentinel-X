import json
from typing import List, Dict, Any

def parse_config(file_path: str) -> List[Dict[str, Any]]:
    """
    Accepts a filepath (assumed JSON) and extracts resource-like objects.
    This simple parser assumes a Terraform state-like structure or AWS Config snapshot.
    """
    resources = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Example 1: Terraform state style parsing
        if "resources" in data and isinstance(data["resources"], list):
            for res in data["resources"]:
                if "type" in res and "name" in res:
                    instances = res.get("instances", [{}])
                    for inst in instances:
                        attrs = inst.get("attributes", {})
                        resources.append({
                            "type": res["type"],
                            "name": res["name"],
                            "config": attrs
                        })
                        
        # Example 2: Flat list of objects (simple JSON format)
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and "type" in item:
                    resources.append({
                        "type": item["type"],
                        "name": item.get("name", "unknown"),
                        "config": item.get("config", item)
                    })
                    
    except Exception as e:
        print(f"Error parsing file {file_path}: {e}")
        
    return resources
