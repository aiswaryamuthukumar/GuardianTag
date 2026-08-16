#pragma once

#include <RTClib.h>

// Wraps the DS3231 so the rest of the firmware can just ask "what time is
// it" without caring whether the RTC chip is actually present. Falls back to
// millis()-since-boot-plus-compile-time so timestamps are still monotonic and
// roughly sane if the RTC is missing or its battery is dead.
class RtcClock {
 public:
  bool begin();
  time_t now();

 private:
  RTC_DS3231 rtc_;
  bool rtcReady_ = false;
  time_t bootFallbackEpoch_ = 0;
};
