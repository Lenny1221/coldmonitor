#ifndef TIME_UTILS_H
#define TIME_UTILS_H

#include <Arduino.h>

/**
 * Start NTP time sync (UTC). Call when WiFi is connected.
 * Safe to call multiple times.
 */
void initNtpTime();

/**
 * Get Unix timestamp in milliseconds (UTC).
 * Returns 0 if NTP not yet synced – backend will use server time as fallback.
 */
uint64_t getUnixTimeMs();

/**
 * Returns true if NTP has synced (time is valid).
 */
bool isTimeSynced();

#endif
