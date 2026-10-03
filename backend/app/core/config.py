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

    # AUTH - signs login tokens. Must be set in .env (a long random string).
    jwt_secret: str = ""
    access_token_days: int = 7

    # TELEGRAM
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    telegram_webhook_secret: str = ""

    # EXPO PUSH
    expo_access_token: str = ""

    # HOSTEL STAFF - required to register on the app's Hostel staff tab
    staff_invite_code: str = ""

    # BACKGROUND MONITOR (escalation, offline detection, auto-arm schedules)
    monitor_enabled: bool = True
    monitor_interval_seconds: int = 15
    escalation_seconds: int = 30
    offline_after_seconds: int = 180
    # Schedules and quiet hours are entered in local wall-clock time
    app_timezone: str = "Asia/Kolkata"

    # DEMO CONTROLS - in-app buttons that act out device events (see routers/demo.py)
    demo_tools_enabled: bool = True

    # UPLOADS (asset photos, incident evidence) - served back at /uploads
    upload_dir: str = "uploads"
    max_upload_bytes: int = 5 * 1024 * 1024

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError(
                "DATABASE_URL is required. Set it in your .env file.\n"
                "Format: postgresql+psycopg2://user:password@host:port/dbname"
            )
        return v

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "JWT_SECRET must be at least 32 characters. Generate one with:\n"
                '  python -c "import secrets; print(secrets.token_hex(32))"'
            )
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str | None:
        """In development, also allow the Expo web preview from localhost or any private
        LAN / hotspot address, whose IP changes as you move networks. Never in production."""
        if self.env != "development":
            return None
        return r"https?://(localhost|127\.0\.0\.1|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})(:\d+)?"


@lru_cache
def get_settings() -> Settings:
    return Settings()