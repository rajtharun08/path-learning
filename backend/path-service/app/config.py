from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Path Service"
    app_version: str = "1.0.0"
    app_port: int = 8006

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/path_service_db"
    )

    content_service_base_url: str = "http://127.0.0.1:8002"
    progress_service_base_url: str = "http://127.0.0.1:8003"
    analytics_service_base_url: str = "http://127.0.0.1:8004"
    admin_jwt_secret_key: str = ""
    admin_jwt_algorithm: str = "HS256"

    http_timeout_seconds: float = 5.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
