import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def _send_real_email(to_email: str, subject: str, text_body: str):
        if not settings.SMTP_HOST:
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_FROM
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(text_body, 'plain'))
            
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            return False

    @staticmethod
    def _fallback_console_email(to_email: str, subject: str, text_body: str):
        print("\n" + "="*50)
        print("MOCK EMAIL SERVICE")
        print("="*50)
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"\n{text_body}")
        print("="*50 + "\n")

    @classmethod
    def send_verification_email(cls, email: str, token: str):
        subject = "Verify your CloudSentinel X account"
        body = f"Click the link below to verify your account:\nhttp://localhost:5173/verify-email?token={token}"
        
        if not cls._send_real_email(email, subject, body):
            cls._fallback_console_email(email, subject, body)
        logger.info(f"Verification email processed for {email}")

    @classmethod
    def send_reset_password_email(cls, email: str, token: str):
        subject = "Reset your CloudSentinel X password"
        body = f"Click the link below to reset your password:\nhttp://localhost:5173/reset-password?token={token}"
        
        if not cls._send_real_email(email, subject, body):
            cls._fallback_console_email(email, subject, body)
        logger.info(f"Password reset email processed for {email}")

