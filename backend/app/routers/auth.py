import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import (
    ChangePasswordIn,
    LoginIn,
    RegisterIn,
    TelegramLinkCodeOut,
    TokenOut,
    UserOut,
    UserUpdateIn,
    WardenContactOut,
)
from app.services.notify import wardens_for_block
from app.services.telegram import generate_link_code, telegram_deep_link

router = APIRouter(prefix="/auth", tags=["auth"])

_ROLE_NAMES = {UserRole.STUDENT: "student", UserRole.WARDEN: "hostel staff"}


def _token_response(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user), user=UserOut.model_validate(user))


def _clean(value: str | None) -> str | None:
    return (value or "").strip() or None


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def register(request: Request, payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    """Creates a student or hostel-staff account and signs it in.

    Staff (warden) accounts need the hostel's STAFF_INVITE_CODE, so a student
    can't give themselves hostel-wide access.
    """
    if payload.role == UserRole.WARDEN:
        expected = get_settings().staff_invite_code
        if not expected or not hmac.compare_digest((payload.invite_code or "").strip(), expected):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid staff invite code")

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    block = _clean(payload.hostel_block)
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        hostel_block=block.upper() if block else None,
        phone=_clean(payload.phone),
        # Staff aren't in a room; a student's room can also be filled in later.
        room_number=_clean(payload.room_number) if payload.role == UserRole.STUDENT else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    """Role-based sign-in: the account's role must match the tab it signs in from."""
    user = db.query(User).filter(User.email == payload.email).first()
    # Same message for unknown email and wrong password, so emails can't be probed.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if user.role != payload.role:
        tab = "Hostel staff" if user.role == UserRole.WARDEN else "Student"
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, f"This is a {_ROLE_NAMES[user.role]} account. Sign in from the {tab} tab."
        )
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.post("/telegram/link-code", response_model=TelegramLinkCodeOut)
def create_telegram_link_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TelegramLinkCodeOut:
    """Issues a one-time code the user sends to the bot (via /start) to link their chat.

    Consumed by the /webhooks/telegram handler, which matches the code back to
    this user and stores their chat_id.
    """
    code = generate_link_code()
    current_user.telegram_link_code = code
    db.commit()
    return TelegramLinkCodeOut(link_code=code, deep_link=telegram_deep_link(code))


@router.get("/wardens", response_model=list[WardenContactOut])
def my_wardens(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[User]:
    """Wardens a student can call from the emergency screen: their block's, plus hostel-wide ones."""
    return wardens_for_block(db, current_user.hostel_block)
