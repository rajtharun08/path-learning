from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:Tharun%4008@localhost:5432/content_db"
    youtube_api_key: str = "" # Optional since we are moving to manual-only mode
    admin_jwt_secret_key: str = "local-dev-secret"
    admin_jwt_algorithm: str = "HS256"
    service_port: int = 8002
    rate_limit_per_minute: int = 100
    cache_ttl_hours: int = 24
    page_size_default: int = 20
    page_size_max: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
