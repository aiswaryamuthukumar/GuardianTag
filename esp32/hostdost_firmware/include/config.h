#pragma once

// --- Detection tuning ---
constexpr float MOTION_THRESHOLD_G = 0.35f;         // accel delta (g) above rest to count as motion
constexpr unsigned long MOTION_HOLD_MS = 400;        // how long a motion flag stays "fresh"
constexpr unsigned long HALL_HOLD_MS = 800;          // how long a hall-trigger flag stays "fresh"
constexpr unsigned long DUAL_VERIFY_WINDOW_MS = 2000; // motion + hall must both be fresh within this window
constexpr unsigned long DISARM_WINDOW_MS = 3000;     // grace period after a confirmed trigger
constexpr unsigned long DEBOUNCE_MS = 50;

// --- Networking ---
constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
constexpr unsigned long HTTP_TIMEOUT_MS = 4000;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 60000;
constexpr int EVENT_QUEUE_LENGTH = 32;
constexpr int MAX_HTTP_RETRIES_PER_EVENT = 5;

// --- Task loop pacing ---
constexpr unsigned long ALARM_TASK_PERIOD_MS = 20;   // sensor/alarm core tick rate
constexpr unsigned long NETWORK_TASK_PERIOD_MS = 200; // network core tick rate

// --- Buzzer patterns (durations in ms) ---
constexpr int PREALERT_BEEP_ON_MS = 80;
constexpr int PREALERT_BEEP_OFF_MS = 400;
constexpr int ALARM_BEEP_ON_MS = 300;
constexpr int ALARM_BEEP_OFF_MS = 150;
