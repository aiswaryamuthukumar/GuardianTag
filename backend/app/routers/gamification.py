from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.gamification import (
    Achievement,
    Challenge,
    ChallengeCompletion,
    SecurityScore,
    UserAchievement,
    XPTransaction,
)
from app.models.user import User
from app.schemas.gamification import (
    AchievementOut,
    ChallengeOut,
    LevelInfoOut,
    ProgressItemOut,
    SecurityScoreOut,
    UserAchievementOut,
    XPTransactionOut,
)
from app.services.gamification import LEVEL_THRESHOLDS, get_or_create_security_score, metric_value

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/xp", response_model=list[XPTransactionOut])
def list_xp_transactions(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[XPTransaction]:
    return (
        db.query(XPTransaction)
        .filter(XPTransaction.user_id == current_user.id)
        .order_by(XPTransaction.created_at.desc())
        .all()
    )


@router.get("/achievements", response_model=list[AchievementOut])
def list_achievements(db: Session = Depends(get_db)) -> list[Achievement]:
    return db.query(Achievement).order_by(Achievement.name).all()


@router.get("/achievements/unlocked", response_model=list[UserAchievementOut])
def list_unlocked_achievements(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[UserAchievement]:
    return (
        db.query(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.unlocked_at.desc())
        .all()
    )


@router.get("/challenges", response_model=list[ChallengeOut])
def list_challenges(db: Session = Depends(get_db)) -> list[Challenge]:
    return db.query(Challenge).filter(Challenge.is_active.is_(True)).all()


@router.get("/security-score", response_model=SecurityScoreOut)
def get_security_score(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SecurityScore:
    score = get_or_create_security_score(db, current_user)
    db.commit()
    return score


@router.get("/level", response_model=LevelInfoOut)
def get_level(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> LevelInfoOut:
    """Score plus where the current level starts and what the next one needs, for a progress bar."""
    score = get_or_create_security_score(db, current_user)
    db.commit()
    floor, next_level, next_at = 0, None, None
    for threshold, level in LEVEL_THRESHOLDS:
        if score.score >= threshold:
            floor = threshold
        elif next_at is None:
            next_level, next_at = level, threshold
    return LevelInfoOut(
        score=score.score,
        level=score.level,
        streak_days=score.streak_days,
        level_floor=floor,
        next_level=next_level,
        next_level_at=next_at,
    )


@router.get("/progress", response_model=list[ProgressItemOut])
def get_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ProgressItemOut]:
    """Every achievement and active challenge with the caller's live progress towards it."""
    score = get_or_create_security_score(db, current_user)
    db.commit()
    unlocked = {
        ua.achievement_id: ua.unlocked_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id)
    }
    completed = {
        cc.challenge_id: cc.completed_at
        for cc in db.query(ChallengeCompletion).filter(ChallengeCompletion.user_id == current_user.id)
    }

    def item(kind, obj, title, done_at) -> ProgressItemOut:
        criteria = obj.criteria or {}
        target = int(criteria.get("target") or 1)
        value = metric_value(db, current_user, score, criteria["metric"]) if criteria.get("metric") else 0
        return ProgressItemOut(
            kind=kind,
            key=obj.key,
            title=title,
            description=obj.description,
            icon=getattr(obj, "icon", None),
            xp_reward=obj.xp_reward,
            progress=target if done_at else min(value, target),
            target=target,
            completed=done_at is not None,
            completed_at=done_at,
        )

    items = [item("challenge", c, c.title, completed.get(c.id)) for c in db.query(Challenge).filter(Challenge.is_active.is_(True))]
    items += [item("achievement", a, a.name, unlocked.get(a.id)) for a in db.query(Achievement).order_by(Achievement.name)]
    return items
