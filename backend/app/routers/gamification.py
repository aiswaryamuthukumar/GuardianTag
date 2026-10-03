from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.enums import IncidentStatus
from app.models.gamification import (
    Achievement,
    Challenge,
    ChallengeCompletion,
    SecurityScore,
    UserAchievement,
    XPTransaction,
)
from app.models.incident import Incident
from app.models.user import User
from app.schemas.gamification import (
    AchievementOut,
    ChallengeOut,
    DailyCheckOut,
    LevelInfoOut,
    ProgressItemOut,
    SecurityScoreOut,
    UserAchievementOut,
    WeeklySummaryOut,
    XPTransactionOut,
)
from app.services.gamification import (
    DAILY_CHECK_XP,
    LEVEL_THRESHOLDS,
    complete_daily_check,
    daily_check_done_today,
    get_or_create_security_score,
    local_day_start,
    metric_value,
)

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


def _daily_check_state(db: Session, user: User) -> DailyCheckOut:
    score = get_or_create_security_score(db, user)
    db.commit()
    return DailyCheckOut(
        done_today=daily_check_done_today(db, user, get_settings().app_timezone),
        streak_days=score.streak_days,
        xp_reward=DAILY_CHECK_XP,
    )


@router.get("/daily-check", response_model=DailyCheckOut)
def get_daily_check(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DailyCheckOut:
    return _daily_check_state(db, current_user)


@router.post("/daily-check", response_model=DailyCheckOut)
def do_daily_check(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DailyCheckOut:
    """Once per local day: +10 XP and it keeps the streak alive. Repeating it is a no-op."""
    complete_daily_check(db, current_user, get_settings().app_timezone)
    return _daily_check_state(db, current_user)


@router.get("/weekly-summary", response_model=WeeklySummaryOut)
def weekly_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> WeeklySummaryOut:
    since = local_day_start(get_settings().app_timezone, days_ago=6)
    xp = (
        db.query(func.coalesce(func.sum(XPTransaction.amount), 0))
        .filter(XPTransaction.user_id == current_user.id, XPTransaction.created_at >= since)
        .scalar()
    )
    alerts = (
        db.query(func.count(Incident.id))
        .filter(Incident.user_id == current_user.id, Incident.triggered_at >= since)
        .scalar()
    )
    resolved = (
        db.query(func.count(Incident.id))
        .filter(
            Incident.user_id == current_user.id,
            Incident.resolved_at >= since,
            Incident.status.in_((IncidentStatus.RESOLVED, IncidentStatus.FALSE_ALARM)),
        )
        .scalar()
    )
    protected = (
        db.query(func.count(func.distinct(Asset.device_id)))
        .filter(Asset.owner_id == current_user.id, Asset.is_armed.is_(True), Asset.device_id.isnot(None))
        .scalar()
    )
    score = get_or_create_security_score(db, current_user)
    db.commit()
    return WeeklySummaryOut(
        xp_gained=int(xp or 0),
        streak_days=score.streak_days,
        alerts=alerts or 0,
        resolved_cases=resolved or 0,
        protected_devices=protected or 0,
    )
