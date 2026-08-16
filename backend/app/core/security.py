from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User


class TokenError(Exception):
    """Raised when a Clerk token fails verification; callers map this to their own error type."""


@lru_cache
def _jwk_client() -> PyJWKClient:
    settings = get_settings()
    if not settings.clerk_jwks_url:
        raise RuntimeError("CLERK_JWKS_URL is not configured")
    return PyJWKClient(settings.clerk_jwks_url)


def _extract_bearer_token(request: Request) -> str:
    header = request.headers.get("authorization")
    if not header or not header.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return header.split(" ", 1)[1]


def decode_clerk_token(token: str) -> dict:
    """Verifies a raw Clerk session JWT against Clerk's JWKS and returns its claims."""
    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except (jwt.PyJWTError, PyJWKClientError) as exc:
        raise TokenError(str(exc)) from exc


def get_current_claims(request: Request) -> dict:
    """Verifies the request's Clerk session JWT against Clerk's JWKS and returns its claims."""
    token = _extract_bearer_token(request)
    try:
        return decode_clerk_token(token)
    except TokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    claims = get_current_claims(request)
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject claim")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "User profile not found; call /auth/sync first"
        )
    return user
