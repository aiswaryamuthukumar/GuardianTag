#pragma once

// Set (never cleared) by the alarm task the instant it enters full Alarming
// state; polled and cleared by the network task. A plain volatile bool is
// enough here - it's a single producer / single consumer flag, not a queue,
// so there's nothing to lose by a torn read on a 32-bit-aligned bool.
extern volatile bool g_telegramAlertPending;
