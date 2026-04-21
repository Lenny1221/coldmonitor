#include "watchdog_tpl5010.h"
#include "pins_carrier.h"

namespace {
constexpr uint16_t WDT_PULSE_US = 20;   // TPL5010: 100 ns min HIGH; 20 µs is ruim.
bool s_initialized = false;
} // namespace

void initWatchdog() {
  pinMode(PIN_WDT_DONE, OUTPUT);
  digitalWrite(PIN_WDT_DONE, LOW);
  s_initialized = true;
  kickWatchdog();  // Geef vanaf nu een volle ~30 s marge.
}

void kickWatchdog() {
  if (!s_initialized) return;
  digitalWrite(PIN_WDT_DONE, HIGH);
  delayMicroseconds(WDT_PULSE_US);
  digitalWrite(PIN_WDT_DONE, LOW);
}
