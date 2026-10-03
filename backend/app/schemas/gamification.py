from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import GuardianLevel
from app.schemas.common import ORMBase


class XPTransactionOut(ORMBase):
    id: UUID
    amount: int
    reason: str
    reference_type: str | None = None
    reference_id: UUID | None = None
    created_at: datetime


class AchievementOut(ORMBase):
    id: UUID
    key: str
    name: str
    description: str
    icon: str | None = None
    xp_reward: int


class UserAchievementOut(ORMBase):
    id: UUID
    achievement: AchievementOut
    unlocked_at: datetime


class ChallengeOut(ORMBase):
    id: UUID
    key: str
    title: str
    description: str
    xp_reward: int
    is_active: bool
    start_at: datetime | None = None
    end_at: datetime | None = None


class SecurityScoreOut(ORMBase):
    score: int
    level: GuardianLevel
    streak_days: int
    last_calculated_at: datetime


class ProgressItemOut(BaseModel):
    """One achievement or challenge with the user's live progress towards it."""

    kind: str  # "achievement" | "challenge"
    key: str
    title: str
    description: str
    icon: str | None = None
    xp_reward: int
    progress: int
    target: int
    completed: bool
    completed_at: datetime | None = None


class LevelInfoOut(BaseModel):
    score: int
    level: GuardianLevel
    streak_days: int
    level_floor: int
    next_level: GuardianLevel | None
    next_level_at: int | None


class DailyCheckOut(BaseModel):
    done_today: bool
    streak_days: int
    xp_reward: int


class WeeklySummaryOut(BaseModel):
    xp_gained: int
    streak_days: int
    alerts: int
    resolved_cases: int
    protected_devices: int
