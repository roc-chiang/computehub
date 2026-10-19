from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    PROJECT_NAME: str = "ComputeHub"

    # Database
    DATABASE_URL: Optional[str] = None
    
    # PostgreSQL (optional, only if not using DATABASE_URL)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "computehub"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minio"
    MINIO_SECRET_KEY: str = "minio123"
    MINIO_BUCKET: str = "models"

    # Security & Env
    SECRET_KEY: str = "supersecret"
    ENVIRONMENT: str = "development"

    # Provider API Keys
    RUNPOD_API_KEY: str = ""
    VASTAI_API_KEY: str = ""
    LAMBDA_API_KEY: str = ""
    
    # Testing Mode
    DRY_RUN: bool = False  # If True, don't make real API calls to providers

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.ENVIRONMENT == "production":
            unsafe_values = {
                "POSTGRES_PASSWORD": (self.POSTGRES_PASSWORD, "postgres"),
                "MINIO_ACCESS_KEY": (self.MINIO_ACCESS_KEY, "minio"),
                "MINIO_SECRET_KEY": (self.MINIO_SECRET_KEY, "minio123"),
                "SECRET_KEY": (self.SECRET_KEY, "supersecret"),
            }
            invalid = [name for name, (value, default) in unsafe_values.items() if not value or value == default]
            if invalid:
                raise ValueError(f"Unsafe production configuration: {', '.join(invalid)}")
            if self.DRY_RUN:
                raise ValueError("DRY_RUN cannot be enabled in production")
        return self

settings = Settings()
