from functools import lru_cache

from pydantic import AnyHttpUrl, Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Bolao IA Lab API"
    environment: str = "local"
    frontend_app_url: str = "http://localhost:5173"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    database_url: PostgresDsn = "postgresql+asyncpg://bolao:bolao@localhost:5432/bolao"  # type: ignore[assignment]
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    log_level: str = "INFO"
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: AnyHttpUrl | str = "http://localhost:8000/api/v1/auth/google/callback"

    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    api_football_key: str = ""
    api_football_base_url: str = "https://v3.football.api-sports.io"
    api_football_default_league: int | None = None
    api_football_default_season: int | None = None

    whatsapp_provider: str = "mock"
    whatsapp_gateway_url: str = "http://localhost:3001"
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""

    notification_scheduler_enabled: bool = True
    notification_scheduler_interval_seconds: int = 900
    notification_reminder_window_minutes: int = 60

    @field_validator("api_football_default_league", "api_football_default_season", mode="before")
    @classmethod
    def empty_string_as_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
