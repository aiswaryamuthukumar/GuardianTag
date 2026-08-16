#pragma once

#include <Arduino.h>

#include "event_queue.h"

// Owns Wi-Fi connectivity, draining the event queue to the backend, periodic
// device-health heartbeats, and a best-effort direct-to-Telegram emergency
// notification. Everything here is best-effort: a stalled or absent network
// never blocks (this task doesn't touch the buzzer/sensor pins at all), and
// failures are retried with backoff rather than crashing the device.
class NetworkManager {
 public:
  void begin();

  // Call every network-task tick (NETWORK_TASK_PERIOD_MS). May block for up
  // to HTTP_TIMEOUT_MS during an actual request, which is fine here since
  // this task is separate from the alarm/sensor task.
  void update();

 private:
  unsigned long lastWifiAttemptAt_ = 0;
  unsigned long lastHeartbeatAt_ = 0;
  unsigned long bootMillis_ = 0;
  int currentEventRetries_ = 0;

  void maintainWifiConnection();
  void drainEventQueue();
  void sendHeartbeatIfDue();
  void sendPendingTelegramAlert();

  bool postEvent(const SensorEventMessage &msg);
  bool postHeartbeat();
  bool sendTelegramMessage(const String &text);
};
