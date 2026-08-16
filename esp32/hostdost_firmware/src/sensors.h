#pragma once

#include <Adafruit_MPU6050.h>

// Thin wrapper around the raw motion/hall inputs. Debouncing and "freshness"
// windows live here so the alarm state machine only deals with clean booleans.
class Sensors {
 public:
  bool begin();

  // Call every alarm-task tick. Cheap and non-blocking.
  void update();

  // True if a motion spike was seen within MOTION_HOLD_MS of now.
  bool motionFresh() const;

  // True if the hall sensor changed state within HALL_HOLD_MS of now.
  bool hallFresh() const;

  // Monotonically increasing counters, incremented once per new trigger edge
  // (not once per tick while the "fresh" window is open). Callers diff these
  // against their own last-seen value to detect "a new trigger just happened".
  unsigned long motionTriggerCount() const { return motionTriggerCount_; }
  unsigned long hallTriggerCount() const { return hallTriggerCount_; }

 private:
  Adafruit_MPU6050 mpu_;
  bool mpuReady_ = false;

  float baselineAccelMagnitude_ = 1.0f; // ~1g at rest
  unsigned long lastMotionAt_ = 0;
  bool motionEverSeen_ = false;
  unsigned long motionTriggerCount_ = 0;

  int lastHallState_ = HIGH;
  unsigned long lastHallChangeAt_ = 0;
  unsigned long lastHallReadAt_ = 0;
  bool hallEverTriggered_ = false;
  unsigned long hallTriggerCount_ = 0;

  bool wasAboveMotionThreshold_ = false;

  void updateMotion();
  void updateHall();
};
