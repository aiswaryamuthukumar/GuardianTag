#pragma once

#include <Arduino.h>

// Kept intentionally small and POD so it can move through a FreeRTOS queue by value.
// Mirrors the backend's SensorEventType enum (app/models/enums.py). Heartbeats
// are reported through /device-health instead, since they carry battery/RSSI
// fields that don't belong on a sensor_events row.
enum class EventKind : uint8_t {
  Movement,
  HallTrigger,
  DualVerified,
  Disarmed,
};

struct SensorEventMessage {
  EventKind kind;
  time_t deviceTimestamp;
};

// Created in main.cpp, consumed by the network task. The alarm task only ever
// writes to this with a zero-timeout send, so a full queue or a stalled
// network task can never block sensor/alarm processing.
extern QueueHandle_t g_eventQueue;

inline const char *eventKindToString(EventKind kind) {
  switch (kind) {
    case EventKind::Movement:
      return "movement";
    case EventKind::HallTrigger:
      return "hall_trigger";
    case EventKind::DualVerified:
      return "dual_verified";
    case EventKind::Disarmed:
      return "disarmed";
  }
  return "unknown";
}
