"""Who hears about what over WebSocket.

Everything here is sync and meant to be called from sync endpoints or the
monitor's worker-thread DB pass; see ConnectionManager.broadcast_from_sync.
"""

from app.models.device import Device
from app.models.enums import UserRole
from app.models.user import User
from app.ws.manager import manager


def user_channel(user_id) -> str:
    return f"user:{user_id}"


def device_channel(device_id) -> str:
    return f"device:{device_id}"


def warden_channels(hostel_block: str | None) -> list[str]:
    """Channels a hostel-wide message about a student in this block goes to."""
    channels = ["wardens:*"]
    if hostel_block:
        channels.append(f"wardens:{hostel_block}")
    return channels


def subscriptions_for(user: User) -> list[str]:
    """Channels a user's /ws/me socket listens on."""
    channels = [user_channel(user.id)]
    if user.role == UserRole.WARDEN:
        channels.append(f"wardens:{user.hostel_block}" if user.hostel_block else "wardens:*")
    return channels


def publish_device(device: Device, message: dict, owner: User | None = None, to_wardens: bool = False) -> None:
    channels = [device_channel(device.id), user_channel(device.owner_id)]
    if to_wardens:
        channels += warden_channels(owner.hostel_block if owner else None)
    manager.broadcast_from_sync(channels, message)


def publish_user(user_id, message: dict) -> None:
    manager.broadcast_from_sync([user_channel(user_id)], message)
