# GuardianTag: IoT Smart Hostel Security System

Object-level security for hostel belongings. An ESP32 unit (MPU6050 motion + Hall-effect sensor) is attached to a
bag, locker or drawer. It raises an alarm only when **both** sensors trigger together, sounds a local buzzer with no
network dependency, and reports events over Wi-Fi to a FastAPI backend. The backend stores them in PostgreSQL and
pushes them to the React Native app in real time over one WebSocket. It also sends push and Telegram alerts, and
escalates unanswered alerts to the hostel warden.

CS4504 Mobile Application Development PBL, Chennai Institute of Technology.

## Repo layout

```
backend/   FastAPI + SQLAlchemy + Alembic + PostgreSQL: REST API, WebSocket, background monitor
mobile/    Expo + React Native + TypeScript + NativeWind app (student and warden roles)
esp32/     ESP32 firmware (PlatformIO / Arduino, FreeRTOS dual-core)
```

## Data flow

```
ESP32 (MPU6050 + Hall) --> local buzzer (always; never waits on the network)
   |
   +--> POST /api/v1/events, /device-health --> PostgreSQL
                                   |
                                   +--> WebSocket /ws/me --> app (live dashboard, emergency screen, warden board)
                                   +--> Expo push + Telegram
   background monitor (every 15s): escalate unanswered alerts -> wardens,
                                   mark silent devices offline, run auto-arm schedules
```

## Application modules

| # | Module | What it does | Main endpoints |
|---|---|---|---|
| 1 | Auth & onboarding | Role-based login and register (Student / Hostel staff tabs); staff need an invite code | `/auth/register`, `/auth/login`, `/auth/me` |
| 2 | Live dashboard | Protection state, open incidents, devices online, score, live sensor feed, arm-all | `/analytics/summary`, `/events`, WS |
| 3 | Devices | Pair, rename, unpair; live "last seen", Wi-Fi signal chart, uptime; auto OFFLINE | `/devices`, `/device-health/{id}` |
| 4 | Belongings (assets) | CRUD with photo, category, location, linked device, per-item history | `/assets`, `/uploads` |
| 5 | Guardian Mode | Arm/disarm each item or all at once; weekly auto-arm schedules | `/assets/arm-all`, `/schedules` |
| 6 | Live activity | Raw sensor event stream with filters; shows triggers ignored while disarmed | `/events`, WS `sensor_event` |
| 7 | Incidents | Filtered list; detail with Timeline / Evidence (photo, note) / Resolve; acknowledge | `/incidents/*` |
| 8 | Emergency alert | Full-screen alarm with vibration on a new incident: false alarm / check / call warden | WS `incident_created` |
| 9 | Notifications | Live inbox with unread badge, mark read/all, hostel notices, quiet hours, channel toggles | `/notifications/*`, `/notices` |
| 10 | Analytics & reports | Incident trend, weekday × hour heatmap, coverage ring, response times, PDF export | `/analytics/*` |
| 11 | Security score | Level progress, streak, XP history, challenges/achievements with live progress | `/gamification/*` |
| 12 | Profile & settings | Edit profile, alert preferences, Telegram link, change password, sign out | `/auth/*` |
| 13 | Warden live board | Hostel-wide active incidents, most urgent first; acknowledge, call student | `/warden/incidents` |
| 14 | Rooms overview | Colour-coded room grid (alert / offline / armed / idle) with students and devices | `/warden/rooms` |
| 15 | Hostel notices | Broadcast to a block or the whole hostel (push + Telegram + inbox) | `/warden/notices` |
| 16 | Hostel analytics | Incidents by block and hour, fleet online %, response time, false-alarm rate | `/warden/analytics` |

### Backend features that make up for the prototype firmware

The firmware is unchanged, so the backend handles what the device can't:

- **Software arming gate.** A trigger from a device whose linked belongings are all disarmed is stored but raises no
  incident. The device's physical button still controls the buzzer.
- **Clock-skew tolerance.** The ESP32 RTC is set from build-machine local time (IST read as UTC is about 5.5 h ahead).
  Future timestamps fall back to server time instead of being rejected.
- **Escalation.** An incident still open after 30 s is raised to HIGH, and the student's wardens are notified.
- **Offline detection.** No heartbeat for 3 minutes marks the device OFFLINE and notifies the owner.

Known limitations: the app can't switch the buzzer itself, and `/events` and `/device-health` are rate-limited but not
authenticated (the firmware has no device key).

## Authentication

GuardianTag runs its own login; no third-party auth service is involved.

- **Storage:** accounts live in the PostgreSQL `users` table: email (lower-case, unique), a **bcrypt** `password_hash`
  (the password itself is never stored), `role` (`STUDENT` or `WARDEN`), and profile fields (block, room, phone…).
- **Login:** `POST /auth/login` with `{email, password, role}` checks the hash and returns a signed **JWT** (HS256,
  signed with `JWT_SECRET`, valid `ACCESS_TOKEN_DAYS`). The token carries the user id and role. The app keeps it in the
  phone's secure storage (Keychain/Keystore) and sends it as `Authorization: Bearer …` and on the WebSocket.
- **Roles:** the login screen has **Student** and **Hostel staff** tabs, and an account can only sign in from the tab
  matching its role. Staff-only endpoints (`/warden/*`) also check the role server-side and return 403 for students.
- **Staff accounts:** registering on the Hostel staff tab requires `STAFF_INVITE_CODE` from the backend `.env`.
- Wrong password and unknown email return the same error; login is rate-limited to 10 attempts per minute.

## Getting started

### 1. Database (PostgreSQL)

```bash
docker compose up -d        # repo root: Postgres on localhost:5433, user/pass/db = guardiantag
```

Or use your own PostgreSQL: create a database and put its URL in `DATABASE_URL`.

### 2. Backend

```bash
cd backend
py -3.11 -m venv .venv
.venv\Scriptsctivate
pip install -r requirements.txt
copy .env.example .env      # set JWT_SECRET and STAFF_INVITE_CODE (see below)
alembic upgrade head        # creates all tables
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Minimum `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://guardiantag:guardiantag@localhost:5433/guardiantag
JWT_SECRET=<output of: python -c "import secrets; print(secrets.token_hex(32))">
STAFF_INVITE_CODE=<any code you give to wardens, e.g. CIT-WARDEN-2026>
```

Telegram and Expo push settings are optional; the app works without them (alerts still arrive in-app, live).

### 3. Mobile

```bash
cd mobile
npm install
copy .env.example .env      # EXPO_PUBLIC_API_URL=http://<your PC's LAN IP>:8000/api/v1
npx expo start
```

The phone and the PC must be on the same Wi-Fi. Find the PC's IP with `ipconfig` (IPv4 Address), and allow
Python through Windows Firewall when asked.

### Demo without hardware

Pair a device in the app with any UID, then:

```bash
cd backend
python scripts/simulate_device.py --uid guardiantag-01 demo       # noise, cancelled trigger, real trigger
python scripts/simulate_device.py --uid guardiantag-01 heartbeat  # keep it online with signal readings
```

### ESP32

See `esp32/hostdost_firmware/README.md`.

## Testing

```bash
cd backend && pytest        # needs Docker: real Postgres via testcontainers, local JWKS for real RS256 auth
cd mobile && npm test       # API client, realtime routing, formatting
cd mobile && npm run typecheck
```

Backend tests cover the arming gate, clock skew, escalation, offline detection, schedules, the per-user WebSocket,
warden scoping and notices, uploads, analytics and gamification progress.
