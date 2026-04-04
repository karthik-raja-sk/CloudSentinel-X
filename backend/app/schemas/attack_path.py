from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

class PathNode(BaseModel):
    type: str
    id: str
    label: str

class PathEdge(BaseModel):
    from_node: str
    to_node: str
    relation: str
    
    class Config:
        populate_by_name = True
        alias_generator = lambda string: "from" if string == "from_node" else ("to" if string == "to_node" else string)

class AttackPathResponse(BaseModel):
    id: int
    project_id: int
    scan_id: int
    title: str
    description: str
    severity: str
    risk_score: int
    path_nodes: Optional[Any] = None
    path_edges: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
