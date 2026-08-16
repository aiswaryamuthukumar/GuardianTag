from datetime import datetime
from uuid import UUID

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
