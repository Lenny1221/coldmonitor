#ifndef RESET_BUTTON_H
#define RESET_BUTTON_H

#include <Arduino.h>

/**
 * RESET BUTTON HANDLER - TWO-STEP RESET
 * 
 * Twee-staps factory reset procedure voor extra veiligheid:
 * 1. Druk BOOT knop in (GPIO 0)
 * 2. Binnen 10 seconden, houd RESET knop 3 seconden ingedrukt
 * 3. NVS wordt gewist en device herstart
 * 
 * WIRING:
 * - GPIO 0 (BOOT button) - eerste stap
 * - GPIO EN (of andere pin) - tweede stap (3 seconden hold)
 * 
 * GEBRUIK:
 * - Roep checkTwoStepReset() aan in loop() of regelmatig in setup()
 * - Bij detectie wordt factory reset uitgevoerd
 */

#define DEFAULT_BOOT_PIN 0      // GPIO 0 = BOOT button (eerste stap)
#define DEFAULT_RESET_PIN 0     // GPIO 0 = zelfde pin (tweede stap: 3s hold)
#define BOOT_WINDOW_MS 10000    // 10 seconden om RESET knop in te drukken na BOOT
#define RESET_HOLD_TIME_MS 3000 // 3 seconden RESET knop vasthouden

enum ResetState {
  RESET_IDLE,           // Geen actie
  RESET_BOOT_PRESSED,   // BOOT knop ingedrukt, wacht op RESET
  RESET_RESET_PRESSING, // RESET knop wordt ingedrukt
  RESET_TRIGGERED      // Reset getriggerd
};

class ResetButtonHandler {
private:
  uint8_t bootPin;
  uint8_t resetPin;
  unsigned long bootWindowMs;
  unsigned long resetHoldTimeMs;
  
  ResetState state;
  unsigned long bootPressTime;
  unsigned long resetPressStartTime;
  bool bootLastState;
  bool resetLastState;
  
public:
  ResetButtonHandler(uint8_t bootPin = DEFAULT_BOOT_PIN, 
                    uint8_t resetPin = DEFAULT_RESET_PIN,
                    unsigned long bootWindow = BOOT_WINDOW_MS,
                    unsigned long resetHoldTime = RESET_HOLD_TIME_MS);
  
  // Check two-step reset sequence - call regularly (returns true if reset triggered)
  bool checkTwoStepReset();
  
  // Simple single-button check (backward compatibility)
  bool check();
  
  // Reset internal state
  void reset();
  
  // Get current state
  ResetState getState();
  
  // Get time remaining in boot window (in ms, 0 if expired)
  unsigned long getBootWindowRemaining();
};

#endif
