from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.core.logging import setup_logging

setup_logging()
from app.core.config import get_settings
from app.routers import (
    analytics,
    assets,
    auth,
    device_health,
    devices,
    events,
    gamification,
    health,
    incidents,
    notifications,
    webhooks,
    ws,
)

settings = get_settings()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="HostDost API", version="0.1.0")
app.state.limiter = limiter

# Add rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
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
    events.router,
    device_health.router,
    incidents.router,
    notifications.router,
    gamification.router,
    analytics.router,
):
    app.include_router(router, prefix=settings.api_v1_prefix)

app.include_router(ws.router)