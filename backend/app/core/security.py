"""GuardianTag's own authentication: bcrypt-hashed passwords in PostgreSQL and
HS256 JWT access tokens that carry the user's id and role."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User

ALGORITHM = "HS256"


class TokenError(Exception):
    """Raised when an access token fails verification; callers map this to their own error type."""


def hash_password(password: str) -> str:
    # bcrypt only looks at the first 72 bytes; truncate explicitly so long passwords don't error.
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode()[:72], password_hash.encode())
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": str(user.id),
        "role": user.role.value,
        "iat": now,
        "exp": now + timedelta(days=settings.access_token_days),
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc


def _user_from_token(db: Session, token: str) -> User | None:
    try:
        claims = decode_token(token)
        return db.get(User, UUID(claims["sub"]))
    except (TokenError, KeyError, ValueError):
        return None


def _extract_bearer_token(request: Request) -> str:
    header = request.headers.get("authorization")
    if not header or not header.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return header.split(" ", 1)[1]


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = _user_from_token(db, _extract_bearer_token(request))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return user


def require_warden(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.WARDEN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Warden access only")
    return current_user


def user_from_ws_token(db: Session, token: str) -> User | None:
    """Resolves a WebSocket ?token= to a user, or None if invalid/unknown."""
    return _user_from_token(db, token)
