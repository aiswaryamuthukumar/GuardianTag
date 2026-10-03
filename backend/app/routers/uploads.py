import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

_ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/heic": ".heic"}


class UploadOut(BaseModel):
    url: str  # path relative to the API origin, e.g. /uploads/ab12.jpg


def upload_root() -> Path:
    root = Path(get_settings().upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root


@router.post("", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)) -> UploadOut:
    """Stores an asset photo or incident evidence image and returns where it's served from."""
    extension = _ALLOWED.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG, WebP or HEIC images")

    limit = get_settings().max_upload_bytes
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image is larger than 5 MB")

    name = f"{uuid.uuid4().hex}{extension}"
    (upload_root() / name).write_bytes(data)
    return UploadOut(url=f"/uploads/{name}")
