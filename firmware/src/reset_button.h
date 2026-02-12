#ifndef RESET_BUTTON_H
#define RESET_BUTTON_H

#include <Arduino.h>

/**
 * RESET BUTTON HANDLER
 * 
 * Detecteert lang indrukken van reset knop (3 seconden) voor factory reset.
 * 
 * WIRING:
 * - GPIO 0 (BOOT button) - standaard op ESP32 DevKit
 * - Of gebruik dedicated GPIO pin (configureerbaar via constructor)
 * 
 * GEBRUIK:
 * - Roep checkResetButton() aan in loop() of regelmatig in setup()
 * - Bij detectie wordt callback aangeroepen
 * - Callback moet factory reset uitvoeren en ESP.restart() aanroepen
 */

#define DEFAULT_RESET_PIN 0  // GPIO 0 = BOOT button
#define RESET_HOLD_TIME_MS 3000  // 3 seconden

class ResetButtonHandler {
private:
  uint8_t pin;
  unsigned long holdTimeMs;
  bool lastState;
  unsigned long pressStartTime;
  bool triggered;
  
public:
  ResetButtonHandler(uint8_t resetPin = DEFAULT_RESET_PIN, unsigned long holdTime = RESET_HOLD_TIME_MS);
  
  // Check button state - call regularly (returns true if reset triggered)
  bool check();
  
  // Reset internal state (call after handling reset)
  void reset();
  
  // Get current button state
  bool isPressed();
  
  // Get time button has been held (in ms)
  unsigned long getHoldTime();
};

#endif
