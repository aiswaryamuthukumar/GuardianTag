#pragma once

#include <Arduino.h>

#include "event_queue.h"
#include "sensors.h"

enum class AlarmState {
  Disarmed,
  Armed,
  DisarmWindow,  // dual-verified trigger fired, user has DISARM_WINDOW_MS to cancel
  Alarming,      // window expired unacknowledged - full alarm until manually cleared
};

// Owns the entire local security loop: reads sensor freshness, drives the
// buzzer, and reacts to the physical disarm button. This class never touches
// Wi-Fi/HTTP and must keep working exactly the same with the radio off - it
// only ever *emits* events for the network task to pick up later, via a
// zero-timeout, non-blocking queue send.
class AlarmController {
 public:
  void begin();

  // Call every alarm-task tick (ALARM_TASK_PERIOD_MS). Non-blocking.
  void update(Sensors &sensors, time_t nowEpoch);

  AlarmState state() const { return state_; }

 private:
  AlarmState state_ = AlarmState::Disarmed;
  unsigned long disarmWindowStartedAt_ = 0;

  // Button edge detection.
  int lastButtonReading_ = HIGH;
  int debouncedButtonState_ = HIGH;
  unsigned long lastButtonEdgeAt_ = 0;

  // Non-blocking buzzer pattern state.
  bool buzzerOn_ = false;
  unsigned long buzzerPhaseStartedAt_ = 0;

  unsigned long lastSeenMotionTriggerCount_ = 0;
  unsigned long lastSeenHallTriggerCount_ = 0;

  bool consumeButtonPress();
  void setBuzzer(bool on);
  void driveBuzzerPattern(int onMs, int offMs);
  void silenceBuzzer();

  void enqueue(EventKind kind, time_t nowEpoch);
};
