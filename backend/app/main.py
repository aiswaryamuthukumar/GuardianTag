import asyncio
import contextlib
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from app.core.logging import setup_logging

setup_logging()
from app.core.config import get_settings  # noqa: E402
from app.core.limiter import limiter  # noqa: E402
from app.routers import (  # noqa: E402
    analytics,
    assets,
    auth,
    demo,
    device_health,
    devices,
    events,
    gamification,
    health,
    incidents,
    notices,
    notifications,
    schedules,
    uploads,
    warden,
    webhooks,
    ws,
)
from app.routers.uploads import upload_root  # noqa: E402
from app.services.monitor import monitor_loop  # noqa: E402

settings = get_settings()


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    task = asyncio.create_task(monitor_loop()) if settings.monitor_enabled else None
    yield
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="GuardianTag API", version="0.2.0", lifespan=lifespan)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again later."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health.router,
    auth.router,
    webhooks.router,
    devices.router,
    assets.router,
    schedules.router,
    events.router,
    device_health.router,
    incidents.router,
    notifications.router,
    notices.router,
    gamification.router,
    analytics.router,
    uploads.router,
    warden.router,
    demo.router,
):
    app.include_router(router, prefix=settings.api_v1_prefix)

app.include_router(ws.router)
app.mount("/uploads", StaticFiles(directory=upload_root()), name="uploads")
