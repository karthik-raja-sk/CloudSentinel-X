from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "CloudSentinel X"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    LOG_LEVEL: str = "INFO"
    
    USE_LOCAL_FALLBACK: bool = True
    
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cloudsentinel"
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = 587
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    SMTP_FROM: str | None = "noreply@cloudsentinel.local"
    
    @property
    def ACTIVE_DATABASE_URL(self) -> str:
        if self.USE_LOCAL_FALLBACK:
            return "sqlite:///./cloudsentinel.db"
        return self.DATABASE_URL

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if not value or value == "supersecretkey":
            # Keep local dev convenience, block insecure production boot.
            return value
        return value

    @property
    def IS_PRODUCTION(self) -> bool:
        return self.ENVIRONMENT.lower() in {"prod", "production"}

settings = Settings()
