"""Test session bootstrap.

Everything in this module runs at *import* time (pytest imports conftest.py
before collecting any test module), which matters here: app.core.database
builds its engine from settings read at import time, so the ephemeral test
Postgres container and the local JWKS stand-in for Clerk must be up and their
URLs written into the environment *before* `app.main` (or anything importing
it) is ever imported - including by test modules themselves.
"""

import base64
import http.server
import json
import os
import threading

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from testcontainers.community.postgres import PostgresContainer

_postgres = PostgresContainer("postgres:16-alpine")
_postgres.start()

# testcontainers defaults to the psycopg2 driver, matching our SQLAlchemy engine.
os.environ["DATABASE_URL"] = _postgres.get_connection_url()

# --- Local stand-in for Clerk's JWKS endpoint, signing with a throwaway key ---
_JWKS_PORT = 9931
_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public_numbers = _private_key.public_key().public_numbers()


def _b64url_uint(n: int) -> str:
    length = (n.bit_length() + 7) // 8
    return base64.urlsafe_b64encode(n.to_bytes(length, "big")).rstrip(b"=").decode()


_JWKS_KID = "test-key-1"
_JWKS_BODY = json.dumps(
    {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": _JWKS_KID,
                "n": _b64url_uint(_public_numbers.n),
                "e": _b64url_uint(_public_numbers.e),
            }
        ]
    }
).encode()

_PRIVATE_KEY_PEM = _private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)


class _JWKSHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(_JWKS_BODY)))
        self.end_headers()
        self.wfile.write(_JWKS_BODY)

    def log_message(self, *args) -> None:  # noqa: D401 - silence request logging
        pass


_jwks_server = http.server.HTTPServer(("127.0.0.1", _JWKS_PORT), _JWKSHandler)
threading.Thread(target=_jwks_server.serve_forever, daemon=True).start()

os.environ["CLERK_JWKS_URL"] = f"http://127.0.0.1:{_JWKS_PORT}/jwks.json"
os.environ["CLERK_WEBHOOK_SECRET"] = "whsec_dGVzdC13ZWJob29rLXNlY3JldC1rZXk="
os.environ["TELEGRAM_WEBHOOK_SECRET"] = "test-telegram-webhook-secret"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:test-token-not-real"
os.environ["TELEGRAM_BOT_USERNAME"] = "HostDostTestBot"

# Everything above must run before this import.
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402

_alembic_ini = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
_alembic_cfg = Config(_alembic_ini)
_alembic_cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
command.upgrade(_alembic_cfg, "head")


import atexit  # noqa: E402

import jwt as pyjwt  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.main import app  # noqa: E402


def _stop_infra() -> None:
    _jwks_server.shutdown()
    _postgres.stop()


atexit.register(_stop_infra)

_engine = create_engine(os.environ["DATABASE_URL"])

# Tables truncated between tests, in FK-safe order (children before parents).
# alembic_version is deliberately excluded - it's schema bookkeeping, not test data.
_DATA_TABLES = [
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
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def make_token():
    """Returns a factory that mints a Clerk-shaped JWT for a given subject (user) id."""

    def _make(sub: str, expired: bool = False) -> str:
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        exp = now - timedelta(minutes=1) if expired else now + timedelta(minutes=5)
        return pyjwt.encode(
            {"sub": sub, "iat": now, "exp": exp},
            _PRIVATE_KEY_PEM,
            algorithm="RS256",
            headers={"kid": _JWKS_KID},
        )

    return _make


@pytest.fixture
def auth_user(client: TestClient, make_token):
    """Registers (via /auth/sync) and returns (headers, user_json) for a fresh test user."""

    def _create(sub: str = "user_test_1", email: str = "test@hostdost.dev", full_name: str = "Test User"):
        token = make_token(sub)
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/v1/auth/sync", headers=headers, json={"email": email, "full_name": full_name})
        assert response.status_code == 200, response.text
        return headers, response.json()

    return _create
