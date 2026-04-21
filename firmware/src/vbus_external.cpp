#include "vbus_external.h"
#include "pins_carrier.h"

void initExternalPowerSense() {
  // BAT54 + R-deler rides de GPIO zelf; geen pullup/pulldown nodig.
  pinMode(PIN_VBUS_DETECT, INPUT);
}

bool isExternalPowerPresent() {
  return digitalRead(PIN_VBUS_DETECT) == HIGH;
}
