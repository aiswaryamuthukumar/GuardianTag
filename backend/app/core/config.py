from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:8081,http://localhost:3000"

    # DATABASE - NO DEFAULT! Must be set in .env
    database_url: str = ""

    # CLERK
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_jwks_url: str = ""
    clerk_webhook_secret: str = ""

    # TELEGRAM
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    telegram_webhook_secret: str = ""

    # EXPO PUSH
    expo_access_token: str = ""

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError(
                "DATABASE_URL is required. Set it in your .env file.\n"
                "Format: postgresql+psycopg2://user:password@host:port/dbname"
            )
        if "localhost" in v and "password" in v:
            # Warn if using default credentials
            print("⚠️  WARNING: Using localhost with credentials - not safe for production!")
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()