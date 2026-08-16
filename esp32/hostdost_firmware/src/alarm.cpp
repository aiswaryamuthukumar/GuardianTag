#include "alarm.h"

#include "alarm_flags.h"
#include "config.h"
#include "event_queue.h"
#include "pins.h"

void AlarmController::begin() {
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_DISARM_BUTTON, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);
  silenceBuzzer();
}

bool AlarmController::consumeButtonPress() {
  int reading = digitalRead(PIN_DISARM_BUTTON);
  unsigned long now = millis();

  if (reading != lastButtonReading_) {
    lastButtonEdgeAt_ = now;
    lastButtonReading_ = reading;
  }

  bool pressEdge = false;
  if (now - lastButtonEdgeAt_ >= DEBOUNCE_MS && reading != debouncedButtonState_) {
    debouncedButtonState_ = reading;
    // Button is wired active-low: a falling edge to LOW is a press.
    pressEdge = (debouncedButtonState_ == LOW);
  }
  return pressEdge;
}

void AlarmController::enqueue(EventKind kind, time_t nowEpoch) {
  SensorEventMessage msg{kind, nowEpoch};
  // Zero timeout: if the network task is behind or the queue is full, this
  // event is dropped rather than ever blocking the alarm loop.
  xQueueSend(g_eventQueue, &msg, 0);
}

void AlarmController::setBuzzer(bool on) {
  buzzerOn_ = on;
  digitalWrite(PIN_BUZZER, on ? HIGH : LOW);
  digitalWrite(PIN_STATUS_LED, on ? HIGH : LOW);
}

void AlarmController::silenceBuzzer() {
  buzzerOn_ = false;
  digitalWrite(PIN_BUZZER, LOW);
}

void AlarmController::driveBuzzerPattern(int onMs, int offMs) {
  unsigned long elapsed = millis() - buzzerPhaseStartedAt_;
  unsigned long phaseLength = buzzerOn_ ? static_cast<unsigned long>(onMs) : static_cast<unsigned long>(offMs);

  if (elapsed >= phaseLength) {
    buzzerPhaseStartedAt_ = millis();
    setBuzzer(!buzzerOn_);
  }
}

void AlarmController::update(Sensors &sensors, time_t nowEpoch) {
  bool pressed = consumeButtonPress();

  // Report individual trigger telemetry whenever armed, regardless of
  // whether this particular tick also causes a dual-verified state change.
  if (state_ != AlarmState::Disarmed) {
    unsigned long motionCount = sensors.motionTriggerCount();
    if (motionCount != lastSeenMotionTriggerCount_) {
      lastSeenMotionTriggerCount_ = motionCount;
      enqueue(EventKind::Movement, nowEpoch);
    }
    unsigned long hallCount = sensors.hallTriggerCount();
    if (hallCount != lastSeenHallTriggerCount_) {
      lastSeenHallTriggerCount_ = hallCount;
      enqueue(EventKind::HallTrigger, nowEpoch);
    }
  }

  switch (state_) {
    case AlarmState::Disarmed: {
      silenceBuzzer();
      if (pressed) {
        state_ = AlarmState::Armed;
      }
      break;
    }

    case AlarmState::Armed: {
      silenceBuzzer();
      if (pressed) {
        state_ = AlarmState::Disarmed;
        break;
      }
      if (sensors.motionFresh() && sensors.hallFresh()) {
        state_ = AlarmState::DisarmWindow;
        disarmWindowStartedAt_ = millis();
        buzzerPhaseStartedAt_ = millis();
        setBuzzer(true);
        enqueue(EventKind::DualVerified, nowEpoch);
      }
      break;
    }

    case AlarmState::DisarmWindow: {
      driveBuzzerPattern(PREALERT_BEEP_ON_MS, PREALERT_BEEP_OFF_MS);

      if (pressed) {
        silenceBuzzer();
        state_ = AlarmState::Armed;
        enqueue(EventKind::Disarmed, nowEpoch);
        break;
      }
      if (millis() - disarmWindowStartedAt_ >= DISARM_WINDOW_MS) {
        state_ = AlarmState::Alarming;
        buzzerPhaseStartedAt_ = millis();
        setBuzzer(true);
        g_telegramAlertPending = true;
      }
      break;
    }

    case AlarmState::Alarming: {
      driveBuzzerPattern(ALARM_BEEP_ON_MS, ALARM_BEEP_OFF_MS);

      if (pressed) {
        silenceBuzzer();
        state_ = AlarmState::Armed;
        enqueue(EventKind::Disarmed, nowEpoch);
      }
      break;
    }
  }
}
