#include "door_contact.h"
#include "pins_carrier.h"
#include "logger.h"

extern Logger logger;

namespace {
constexpr uint32_t DEBOUNCE_MS = 50;

bool     s_openState       = false;  // gedebounced logische toestand
bool     s_lastRawOpen     = false;
uint32_t s_lastChangeMs    = 0;
uint32_t s_openedAtMs      = 0;      // 0 = niet open
bool     s_initialized     = false;

// INPUT_PULLUP + reed schakelt naar GND → LOW = dicht, HIGH = open
inline bool readRawOpen() {
  return digitalRead(PIN_REED_SWITCH) == HIGH;
}
} // namespace

void initDoor() {
  pinMode(PIN_REED_SWITCH, INPUT_PULLUP);
  delay(5);
  s_lastRawOpen   = readRawOpen();
  s_openState     = s_lastRawOpen;
  s_lastChangeMs  = millis();
  s_openedAtMs    = s_openState ? s_lastChangeMs : 0;
  s_initialized   = true;
}

void updateDoor() {
  if (!s_initialized) return;
  const uint32_t now = millis();
  const bool raw = readRawOpen();

  if (raw != s_lastRawOpen) {
    s_lastRawOpen  = raw;
    s_lastChangeMs = now;
    return;
  }
  if (raw == s_openState) return;                    // al in die toestand
  if ((now - s_lastChangeMs) < DEBOUNCE_MS) return;  // nog niet stabiel

  s_openState = raw;
  if (s_openState) {
    s_openedAtMs = now;
    logger.info("[DOOR] opened");
  } else {
    uint32_t dur = s_openedAtMs ? (now - s_openedAtMs) : 0;
    s_openedAtMs = 0;
    logger.info("[DOOR] closed after " + String(dur / 1000) + "s");
  }
}

bool isDoorOpen() {
  return s_openState;
}

uint32_t doorOpenDurationMs() {
  if (!s_openState || !s_openedAtMs) return 0;
  return millis() - s_openedAtMs;
}
