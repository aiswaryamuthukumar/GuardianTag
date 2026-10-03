"""Test session bootstrap.

Everything in this module runs at *import* time (pytest imports conftest.py
before collecting any test module), which matters here: app.core.database
builds its engine from settings read at import time, so the ephemeral test
Postgres container must be up and its URL (plus the auth settings) written
into the environment *before* `app.main` (or anything importing
it) is ever imported - including by test modules themselves.
"""

import os

from testcontainers.postgres import PostgresContainer

_postgres = PostgresContainer("postgres:16-alpine")
_postgres.start()

# testcontainers defaults to the psycopg2 driver, matching our SQLAlchemy engine.
os.environ["DATABASE_URL"] = _postgres.get_connection_url()

os.environ["JWT_SECRET"] = "test-jwt-secret-that-is-at-least-32-characters-long"
os.environ["TELEGRAM_WEBHOOK_SECRET"] = "test-telegram-webhook-secret"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:test-token-not-real"
os.environ["TELEGRAM_BOT_USERNAME"] = "HostDostTestBot"
os.environ["STAFF_INVITE_CODE"] = "test-warden-code"
# Tests drive monitor passes explicitly via app.services.monitor.run_cycle.
os.environ["MONITOR_ENABLED"] = "false"
os.environ["UPLOAD_DIR"] = os.path.join(os.path.dirname(__file__), ".uploads")

# Everything above must run before this import.
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402

_alembic_ini = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
_alembic_cfg = Config(_alembic_ini)
_alembic_cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
command.upgrade(_alembic_cfg, "head")


import atexit  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.core.limiter import limiter  # noqa: E402
from app.main import app  # noqa: E402


def _stop_infra() -> None:
    _postgres.stop()


atexit.register(_stop_infra)

_engine = create_engine(os.environ["DATABASE_URL"])

# Tables truncated between tests, in FK-safe order (children before parents).
# alembic_version is deliberately excluded - it's schema bookkeeping, not test data.
_DATA_TABLES = [
    "notices",
    "arm_schedules",
    "notifications",
    "evidence",
    "incident_timeline",
    "incidents",
    "device_health",
    "sensor_events",
    "challenge_completions",
    "user_achievements",
    "xp_transactions",
    "security_scores",
    "assets",
    "devices",
    "users",
]


@pytest.fixture(autouse=True)
def _clean_db():
    """Truncates all data tables before every test so tests don't leak state into each other."""
    with _engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {', '.join(_DATA_TABLES)} RESTART IDENTITY CASCADE"))
    # The /events rate limit is per client IP, and every TestClient is the same "client".
    limiter.reset()
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def make_token():
    """Returns a factory that mints an access token for a user id, optionally already expired."""

    def _make(user_id: str, expired: bool = False) -> str:
        import jwt
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        exp = now - timedelta(minutes=1) if expired else now + timedelta(minutes=5)
        return jwt.encode({"sub": user_id, "role": "student", "iat": now, "exp": exp}, os.environ["JWT_SECRET"], algorithm="HS256")

    return _make


@pytest.fixture
def auth_user(client: TestClient):
    """Registers (or logs back into) an account and returns (headers, user_json).

    The first argument is kept for readability at call sites (a label for the
    user); accounts are identified by email.
    """

    def _create(
        label: str = "user_test_1",
        email: str = "test@hostdost.dev",
        full_name: str = "Test User",
        role: str = "student",
        **extra,
    ):
        body = {"email": email, "password": "correct-horse-battery", "full_name": full_name, "role": role, **extra}
        response = client.post("/api/v1/auth/register", json=body)
        if response.status_code == 409:
            response = client.post(
                "/api/v1/auth/login", json={"email": email, "password": body["password"], "role": role}
            )
        assert response.status_code in (200, 201), response.text
        data = response.json()
        return {"Authorization": f"Bearer {data['access_token']}"}, data["user"]

    return _create
