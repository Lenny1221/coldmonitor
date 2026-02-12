#include "time_utils.h"
#include <time.h>

static bool ntpStarted = false;

void initNtpTime() {
  if (ntpStarted) return;
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  ntpStarted = true;
}

bool isTimeSynced() {
  time_t now = time(nullptr);
  return (now > 1700000000);  // Na 14 nov 2023 = sync waarschijnlijk gelukt
}

uint64_t getUnixTimeMs() {
  if (!isTimeSynced()) return 0;
  time_t sec = time(nullptr);
  return (uint64_t)sec * 1000ULL + (millis() % 1000);
}
