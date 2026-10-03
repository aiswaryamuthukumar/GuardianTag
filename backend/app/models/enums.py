import enum


class GuardianLevel(str, enum.Enum):
    ROOKIE = "rookie"
    WATCHMAN = "watchman"
    GUARDIAN = "guardian"
    SENTINEL = "sentinel"
    HOSTEL_PROTECTOR = "hostel_protector"


class DeviceStatus(str, enum.Enum):
    UNPAIRED = "unpaired"
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class AssetCategory(str, enum.Enum):
    BAG = "bag"
    LAPTOP = "laptop"
    DOCUMENT = "document"
    OTHER = "other"


class SensorEventType(str, enum.Enum):
    MOVEMENT = "movement"
    HALL_TRIGGER = "hall_trigger"
    DUAL_VERIFIED = "dual_verified"
    DISARMED = "disarmed"
    HEARTBEAT = "heartbeat"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TimelineActor(str, enum.Enum):
    SYSTEM = "system"
    USER = "user"
    DEVICE = "device"


class EvidenceType(str, enum.Enum):
    PHOTO = "photo"
    SENSOR_SNAPSHOT = "sensor_snapshot"
    NOTE = "note"


class NotificationType(str, enum.Enum):
    INCIDENT = "incident"
    ACHIEVEMENT = "achievement"
    CHALLENGE = "challenge"
    DEVICE_HEALTH = "device_health"
    SYSTEM = "system"


class UserRole(str, enum.Enum):
    STUDENT = "student"
    WARDEN = "warden"
