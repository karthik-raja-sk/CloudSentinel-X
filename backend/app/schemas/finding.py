from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Any
from app.schemas.asset import AssetResponse

class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: int
    asset_id: Optional[int] = None
    iam_entity_id: Optional[int] = None
    finding_type: Optional[str] = "Unknown"
    rule_id: Optional[str] = "Unknown"
    severity: Optional[str] = "LOW"
    title: Optional[str] = "Unknown Risk"
    description: Optional[str] = "No description provided"
    resource_id: Optional[str] = "Unknown"
    remediation: Optional[str] = None
    evidence: Optional[str] = None
    risk_score: int
    raw_data: Optional[Any] = None
    recommendation_type: Optional[str] = None
    remediation_text: Optional[str] = None
    sample_masked_value: Optional[str] = None
    remediation_status: Optional[str] = "OPEN"

    @field_validator('finding_type', 'rule_id', 'severity', 'title', 'description', 'resource_id', 'remediation', 'evidence', 'recommendation_type', 'remediation_text', 'sample_masked_value', 'remediation_status', mode='before')
    @classmethod
    def ensure_string(cls, v: Any):
        if v is None:
            return ""
        return str(v)
