from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.db.base_class import Base

class Finding(Base):
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scan.id", ondelete="CASCADE"))
    asset_id = Column(Integer, ForeignKey("asset.id", ondelete="CASCADE"), nullable=True)
    iam_entity_id = Column(Integer, ForeignKey("iamentity.id", ondelete="CASCADE"), nullable=True)
    finding_type = Column(String, index=True, default="misconfiguration")
    rule_id = Column(String, index=True)
    severity = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    resource_id = Column(String, index=True)
    remediation = Column(String, nullable=True)
    evidence = Column(String, nullable=True)
    risk_score = Column(Integer, default=0)
    raw_data = Column(JSON, nullable=True)
    
    # Newly Added PII & Remediation Support Fields
    recommendation_type = Column(String, nullable=True)
    remediation_text = Column(String, nullable=True)
    sample_masked_value = Column(String, nullable=True)
    remediation_status = Column(String, default="OPEN", index=True)
