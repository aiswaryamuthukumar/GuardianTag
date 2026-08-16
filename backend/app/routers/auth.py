from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_claims, get_current_user
from app.models.user import User
from app.schemas.user import TelegramLinkCodeOut, UserOut, UserSyncIn, UserUpdateIn
from app.services.telegram import generate_link_code, telegram_deep_link

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=UserOut)
def sync_profile(
    payload: UserSyncIn,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Upserts the local profile for the Clerk identity in the request's verified token.

    Called by the mobile app right after sign-in/sign-up so a profile exists even if the
    Clerk webhook hasn't landed yet.
    """
    claims = get_current_claims(request)
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject claim")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        user = User(clerk_user_id=clerk_user_id, **payload.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


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
