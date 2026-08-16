#pragma once

// Copy this file to secrets.h (gitignored) and fill in real values before building.

#define WIFI_SSID "your-hostel-wifi"
#define WIFI_PASSWORD "your-wifi-password"

// e.g. "http://192.168.1.10:8000/api/v1" - no trailing slash.
#define API_BASE_URL "http://192.168.1.10:8000/api/v1"

// Must match the device_uid used when pairing this device in the app.
#define DEVICE_UID "esp32-aa:bb:cc:dd:ee:ff"

// Sent directly from the device to Telegram on a confirmed alarm, independent
// of the backend, so an emergency notification still goes out even if the
// API is unreachable (as long as Wi-Fi/internet is up).
#define TELEGRAM_BOT_TOKEN ""
#define TELEGRAM_CHAT_ID ""
