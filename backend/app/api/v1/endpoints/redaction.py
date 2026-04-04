from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.scanners.pii_detector import mask_pii, get_remediation

router = APIRouter()

class RedactionRequest(BaseModel):
    raw_value: str
    data_type: str  # "EMAIL", "PHONE_NUMBER", "CREDIT_CARD", "AADHAAR", "PAN_CARD", "SECRET"

class RedactionResponse(BaseModel):
    original_snippet: str
    masked_snippet: str
    recommendation_type: str
    remediation_text: str

@router.post("/preview", response_model=RedactionResponse)
def generate_redaction_preview(request: RedactionRequest):
    """
    Simulates redaction processes without persistently overriding databases.
    Crucial for previewing destructive overrides before applying compliance scripts safely.
    """
    if not request.raw_value:
        raise HTTPException(status_code=400, detail="A raw payload value is required.")
        
    db_type = request.data_type.upper()
    
    if db_type == "SECRET":
        # Simulate Secret Rotation Redaction
        masked = request.raw_value[:4] + "*" * (len(request.raw_value)-4) if len(request.raw_value) > 4 else "****"
        return RedactionResponse(
            original_snippet=request.raw_value,
            masked_snippet=masked,
            recommendation_type="ROTATE_IMMEDIATELY",
            remediation_text="Never store secrets in plaintext. Rotate immediately and inject via CI/CD secrets manager."
        )
        
    # Execute through standard PII Masker
    masked = mask_pii(request.raw_value, db_type)
    remedy = get_remediation(db_type)
    
    return RedactionResponse(
        original_snippet=request.raw_value,
        masked_snippet=masked,
        recommendation_type=remedy["type"],
        remediation_text=remedy["text"]
    )
