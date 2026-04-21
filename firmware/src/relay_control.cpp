#include "relay_control.h"
#include "pins_carrier.h"
#include "logger.h"

extern Logger logger;

namespace { bool s_relayState = false; }

void initRelay() {
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);
  s_relayState = false;
}

void setRelay(bool on) {
  if (on == s_relayState) return;
  s_relayState = on;
  digitalWrite(PIN_RELAY, on ? HIGH : LOW);
  logger.info(on ? "[RELAY] ON" : "[RELAY] OFF");
}

bool getRelayState() {
  return s_relayState;
}
