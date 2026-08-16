# HostDost ESP32 Firmware

Dual-core sensor node: MPU6050 (movement) + Hall effect sensor (contact/lid),
DS3231 RTC for timestamps, an active buzzer, and a physical disarm button.

## Design

The firmware is split across two FreeRTOS tasks, pinned to opposite cores:

- **Core 0 — alarm task** (`alarmTask` in `src/main.cpp`): reads the sensors,
  runs the arm/disarm state machine (`AlarmController`), and drives the
  buzzer. This loop never touches Wi-Fi/HTTP and never blocks — it only
  *enqueues* events for the network task via a zero-timeout queue send, so a
  dead radio or a stuck HTTP request can never delay the buzzer.
- **Core 1 — network task** (`networkTask`): owns Wi-Fi, drains the event
  queue to `POST /api/v1/events`, sends a periodic heartbeat to
  `POST /api/v1/device-health`, and fires a best-effort direct-to-Telegram
  message the instant a full alarm triggers (independent of the backend).

State machine (`src/alarm.cpp`):

```
Disarmed --button--> Armed --dual verify--> DisarmWindow --3s no button--> Alarming
   ^                    ^                        |                            |
   |                    +----------button---------+----------button-----------+
   +-----------------------------button (from Armed)-----------------------------
```

"Dual verify" means both the accelerometer and the Hall sensor report a fresh
trigger within their hold windows (`DUAL_VERIFY_WINDOW_MS`-ish correlation via
`MOTION_HOLD_MS`/`HALL_HOLD_MS` in `include/config.h`). Individual
`movement`/`hall_trigger` events are also reported (once per trigger edge) for
analytics, independent of the dual-verify/alarm logic.

## Wiring (see `include/pins.h`)

| Signal | GPIO |
| --- | --- |
| I2C SDA (MPU6050 + DS3231) | 21 |
| I2C SCL (MPU6050 + DS3231) | 22 |
| Hall sensor (active-low) | 27 |
| Buzzer | 25 |
| Disarm button (active-low, `INPUT_PULLUP`) | 26 |
| Status LED | 2 |

## Building

```bash
pip install platformio
cp include/secrets.example.h include/secrets.h   # fill in real Wi-Fi/API/Telegram values
pio run                 # compile
pio run -t upload       # flash
pio device monitor      # serial log
```

`secrets.h` is gitignored — never commit real Wi-Fi credentials or bot tokens.

## Notes

- `device_uid` in `secrets.h` must match the `device_uid` used when pairing
  this device from the mobile app's Device Pairing screen.
- The event/heartbeat retry logic (`src/network.cpp`) gives up on a single
  stuck event after `MAX_HTTP_RETRIES_PER_EVENT` attempts so one bad event
  can't permanently block the queue; it's still logged to Serial either way.
- `RtcClock` falls back to a millis()-since-boot estimate if the DS3231 isn't
  present or its battery died, so timestamps stay monotonic even without the
  RTC chip.
