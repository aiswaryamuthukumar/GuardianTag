#include "sensors.h"

#include <Wire.h>

#include "config.h"
#include "pins.h"

bool Sensors::begin() {
  pinMode(PIN_HALL_SENSOR, INPUT_PULLUP);
  lastHallState_ = digitalRead(PIN_HALL_SENSOR);

  mpuReady_ = mpu_.begin();
  if (mpuReady_) {
    mpu_.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu_.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu_.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }
  return mpuReady_;
}

void Sensors::update() {
  updateMotion();
  updateHall();
}

void Sensors::updateMotion() {
  if (!mpuReady_) return;

  sensors_event_t accel, gyro, temp;
  mpu_.getEvent(&accel, &gyro, &temp);

  // MPU6050 reports m/s^2; convert to g for a more intuitive threshold.
  constexpr float kMetersPerSecondSquaredPerG = 9.80665f;
  float magnitude =
      sqrtf(accel.acceleration.x * accel.acceleration.x + accel.acceleration.y * accel.acceleration.y +
            accel.acceleration.z * accel.acceleration.z) /
      kMetersPerSecondSquaredPerG;

  float delta = fabsf(magnitude - baselineAccelMagnitude_);

  // Slowly track baseline so temperature drift / orientation doesn't cause
  // false positives, but never let an in-progress spike pull the baseline
  // toward it (that would mask real motion).
  if (delta < MOTION_THRESHOLD_G) {
    baselineAccelMagnitude_ = baselineAccelMagnitude_ * 0.98f + magnitude * 0.02f;
  }

  if (delta >= MOTION_THRESHOLD_G) {
    lastMotionAt_ = millis();
    motionEverSeen_ = true;
    if (!wasAboveMotionThreshold_) {
      motionTriggerCount_++;
    }
    wasAboveMotionThreshold_ = true;
  } else {
    wasAboveMotionThreshold_ = false;
  }
}

void Sensors::updateHall() {
  unsigned long now = millis();
  if (now - lastHallReadAt_ < DEBOUNCE_MS) return;
  lastHallReadAt_ = now;

  int state = digitalRead(PIN_HALL_SENSOR);
  if (state != lastHallState_) {
    lastHallState_ = state;
    lastHallChangeAt_ = now;
    hallEverTriggered_ = true;
    hallTriggerCount_++;
  }
}

bool Sensors::motionFresh() const {
  if (!motionEverSeen_) return false;
  return millis() - lastMotionAt_ <= MOTION_HOLD_MS;
}

bool Sensors::hallFresh() const {
  if (!hallEverTriggered_) return false;
  return millis() - lastHallChangeAt_ <= HALL_HOLD_MS;
}
