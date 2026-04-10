from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def log(
        db: Session,
        event_type: str,
        status: str,
        user_id: int | None = None,
        email: str | None = None,
        role: str | None = None,
        project_id: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        message: str | None = None,
        details: str | None = None
    ):
        try:
            audit_entry = AuditLog(
                event_type=event_type,
                status=status,
                user_id=user_id,
                email=email,
                role=role,
                project_id=project_id,
                ip_address=ip_address,
                user_agent=user_agent,
                message=message,
                details=details
            )
            db.add(audit_entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            db.rollback()
