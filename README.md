# HostDost — IoT Hostel Security System

Real-time hostel bag/asset security system: ESP32 sensor node detects unauthorized
movement, sounds a local buzzer instantly (no network dependency), and reports
events to a FastAPI backend which persists them, pushes live updates over
WebSocket to a React Native app, and fires Telegram + push alerts. Users track
incidents, resolve cases, and build up a "Guardian" security score through
gamified positive-habit tracking.

## Repo layout

```
backend/    FastAPI + SQLAlchemy + Alembic + PostgreSQL API and WebSocket server
mobile/     Expo + React Native + TypeScript + NativeWind app
esp32/      ESP32 firmware (Arduino/PlatformIO) for the sensor node
docs/       Architecture notes, API contracts, hardware wiring
```

## Core data flow

```
ESP32 (MPU6050 + Hall sensor) --local buzzer (always, no network needed)
   |
   +--> FastAPI /api/v1/events --> PostgreSQL --> WebSocket /ws/devices/{id} --> App
   |
   +--> Telegram Bot API (emergency notification, independent of backend)
```

The buzzer and emergency detection loop on the ESP32 never wait on Wi-Fi, the
backend, Telegram, or the app. Gamification never influences alarm logic — it
only reads completed incident/event history after the fact.

## Development phases

1. ✅ Foundation — repo structure, tooling, env config
2. ✅ Database models + FastAPI skeleton
3. ✅ Auth (Clerk)
4. ✅ Mobile UI shell
5. ✅ API integration (mobile <-> backend)
6. ✅ ESP32 firmware
7. ✅ WebSocket live updates
8. ✅ Telegram + push notifications
9. ✅ SQLite offline cache/sync
10. ✅ Incidents/evidence workflow
11. ✅ Gamification (XP, levels, achievements, challenges)
12. ✅ Analytics
13. ✅ Testing

## Getting started

### Backend

```bash
cd backend
py -3.11 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # fill in DATABASE_URL, CLERK_*, TELEGRAM_*
alembic upgrade head
uvicorn app.main:app --reload
```

### Mobile

```bash
cd mobile
npm install
copy .env.example .env
npx expo start
```

### ESP32

See `esp32/hostdost_firmware/README.md` (added in Phase 6).

## Testing

### Backend

```bash
cd backend
pytest
```

Spins up a real ephemeral PostgreSQL container per test session (via
`testcontainers`) and runs migrations against it — no mocked database. Also
stands up a throwaway JWKS server locally so auth tests exercise real RS256
JWT verification instead of a stubbed dependency. Requires Docker running
locally. All tables are truncated between tests for isolation.

### Mobile

```bash
cd mobile
npm test
```

Covers pure logic (API client request/error handling, duration formatting).
UI/integration testing is done by hand against a running backend, per
`CLAUDE.md`-equivalent guidance to actually exercise features rather than
trust type-checking alone.
