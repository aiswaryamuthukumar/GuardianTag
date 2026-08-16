#include "network.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

#include "alarm_flags.h"
#include "config.h"
#include "secrets.h"

namespace {
constexpr const char *kFirmwareVersion = "1.0.0";
}

void NetworkManager::begin() {
  bootMillis_ = millis();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttemptAt_ = millis();
}

void NetworkManager::maintainWifiConnection() {
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastWifiAttemptAt_ >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiAttemptAt_ = now;
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

void NetworkManager::update() {
  maintainWifiConnection();

  if (WiFi.status() != WL_CONNECTED) return;

  sendPendingTelegramAlert();
  drainEventQueue();
  sendHeartbeatIfDue();
}

void NetworkManager::sendPendingTelegramAlert() {
  if (!g_telegramAlertPending) return;
  g_telegramAlertPending = false;

  String text = "HostDost ALERT: unauthorized movement detected on device " DEVICE_UID;
  sendTelegramMessage(text);
}

void NetworkManager::drainEventQueue() {
  SensorEventMessage msg;

  while (xQueuePeek(g_eventQueue, &msg, 0) == pdTRUE) {
    if (postEvent(msg)) {
      xQueueReceive(g_eventQueue, &msg, 0);
      currentEventRetries_ = 0;
      continue;
    }

    currentEventRetries_++;
    if (currentEventRetries_ >= MAX_HTTP_RETRIES_PER_EVENT) {
      // Give up on this one event rather than blocking every event behind
      // it forever; it's already durably recorded on-device via Serial log.
      xQueueReceive(g_eventQueue, &msg, 0);
      currentEventRetries_ = 0;
    }
    break;
  }
}

bool NetworkManager::postEvent(const SensorEventMessage &msg) {
  JsonDocument doc;
  doc["device_uid"] = DEVICE_UID;
  doc["event_type"] = eventKindToString(msg.kind);
  doc["device_timestamp"] = static_cast<long>(msg.deviceTimestamp);

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(String(API_BASE_URL) + "/events");
  http.addHeader("Content-Type", "application/json");
  int status = http.POST(body);
  http.end();

  return status >= 200 && status < 300;
}

void NetworkManager::sendHeartbeatIfDue() {
  unsigned long now = millis();
  if (now - lastHeartbeatAt_ < HEARTBEAT_INTERVAL_MS && lastHeartbeatAt_ != 0) return;
  lastHeartbeatAt_ = now;
  postHeartbeat();
}

bool NetworkManager::postHeartbeat() {
  JsonDocument doc;
  doc["device_uid"] = DEVICE_UID;
  doc["status"] = "online";
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime_seconds"] = static_cast<long>(millis() / 1000);
  doc["firmware_version"] = kFirmwareVersion;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(String(API_BASE_URL) + "/device-health");
  http.addHeader("Content-Type", "application/json");
  int status = http.POST(body);
  http.end();

  return status >= 200 && status < 300;
}

bool NetworkManager::sendTelegramMessage(const String &text) {
  if (strlen(TELEGRAM_BOT_TOKEN) == 0 || strlen(TELEGRAM_CHAT_ID) == 0) {
    return false;
  }

  JsonDocument doc;
  doc["chat_id"] = TELEGRAM_CHAT_ID;
  doc["text"] = text;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin("https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + "/sendMessage");
  http.addHeader("Content-Type", "application/json");
  int status = http.POST(body);
  http.end();

  return status >= 200 && status < 300;
}
