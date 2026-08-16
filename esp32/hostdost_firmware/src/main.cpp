#include <Arduino.h>
#include <Wire.h>

#include "alarm.h"
#include "alarm_flags.h"
#include "config.h"
#include "event_queue.h"
#include "network.h"
#include "pins.h"
#include "rtc_clock.h"
#include "sensors.h"

QueueHandle_t g_eventQueue = nullptr;
volatile bool g_telegramAlertPending = false;

namespace {
Sensors g_sensors;
RtcClock g_rtc;
AlarmController g_alarm;
NetworkManager g_network;

// Core 0: sensors + alarm state machine + buzzer. Tight loop, never blocks on
// I/O, and has no idea whether Wi-Fi even exists.
void alarmTask(void *) {
  g_sensors.begin();
  g_rtc.begin();
  g_alarm.begin();

  for (;;) {
    g_sensors.update();
    g_alarm.update(g_sensors, g_rtc.now());
    vTaskDelay(pdMS_TO_TICKS(ALARM_TASK_PERIOD_MS));
  }
}

// Core 1: Wi-Fi, HTTP event delivery, heartbeats, Telegram. Free to block for
// up to HTTP_TIMEOUT_MS per request without affecting local alarm behavior.
void networkTask(void *) {
  g_network.begin();

  for (;;) {
    g_network.update();
    vTaskDelay(pdMS_TO_TICKS(NETWORK_TASK_PERIOD_MS));
  }
}
}  // namespace

void setup() {
  Serial.begin(115200);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  g_eventQueue = xQueueCreate(EVENT_QUEUE_LENGTH, sizeof(SensorEventMessage));

  xTaskCreatePinnedToCore(alarmTask, "alarm", 4096, nullptr, 2, nullptr, 0);
  xTaskCreatePinnedToCore(networkTask, "network", 8192, nullptr, 1, nullptr, 1);
}

void loop() {
  // All real work happens in the two pinned tasks above.
  vTaskDelay(pdMS_TO_TICKS(1000));
}
