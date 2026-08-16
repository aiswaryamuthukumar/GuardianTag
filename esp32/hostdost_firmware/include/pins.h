#pragma once

// I2C bus shared by the MPU6050 and the DS3231 RTC.
constexpr int PIN_I2C_SDA = 21;
constexpr int PIN_I2C_SCL = 22;

// Hall effect sensor: digital output, LOW when a magnet is present (bag flap closed).
constexpr int PIN_HALL_SENSOR = 27;

// Active buzzer, driven directly from a GPIO through a transistor/driver.
constexpr int PIN_BUZZER = 25;

// Physical disarm button: pulled up internally, pressed = LOW.
constexpr int PIN_DISARM_BUTTON = 26;

// Onboard status LED (built-in on most ESP32 dev boards).
constexpr int PIN_STATUS_LED = 2;
