from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloudSentinel X"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    USE_LOCAL_FALLBACK: bool = True
    
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cloudsentinel"
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def ACTIVE_DATABASE_URL(self) -> str:
        if self.USE_LOCAL_FALLBACK:
            return "sqlite:///./cloudsentinel.db"
        return self.DATABASE_URL

    class Config:
        case_sensitive = True

settings = Settings()
