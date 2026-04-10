from pydantic import BaseModel, ConfigDict
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

class AttackPathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
