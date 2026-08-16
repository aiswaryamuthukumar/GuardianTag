#include "rtc_clock.h"

bool RtcClock::begin() {
  rtcReady_ = rtc_.begin();
  if (rtcReady_ && rtc_.lostPower()) {
    // Best effort: stamp with build time until the app/backend can push a
    // real time sync. Still monotonic, just not calendar-accurate.
    rtc_.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  bootFallbackEpoch_ = DateTime(F(__DATE__), F(__TIME__)).unixtime();
  return rtcReady_;
}

time_t RtcClock::now() {
  if (rtcReady_) {
    return rtc_.now().unixtime();
  }
  return bootFallbackEpoch_ + static_cast<time_t>(millis() / 1000);
}
