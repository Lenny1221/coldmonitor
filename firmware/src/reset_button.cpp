#include "reset_button.h"
#include "logger.h"

#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

extern Logger logger;

ResetButtonHandler::ResetButtonHandler(uint8_t bootPin, uint8_t resetPin, 
                                      unsigned long bootWindow, unsigned long resetHoldTime)
  : bootPin(bootPin), resetPin(resetPin), bootWindowMs(bootWindow), resetHoldTimeMs(resetHoldTime),
    state(RESET_IDLE), bootPressTime(0), resetPressStartTime(0),
    bootLastState(HIGH), resetLastState(HIGH) {
  
  pinMode(bootPin, INPUT_PULLUP);
  if (resetPin != bootPin) {
    pinMode(resetPin, INPUT_PULLUP);
  }
  delay(10); // Stabilize pins
  bootLastState = digitalRead(bootPin);
  resetLastState = digitalRead(resetPin);
}

bool ResetButtonHandler::checkTwoStepReset() {
  unsigned long now = millis();
  bool bootPressed = (digitalRead(bootPin) == LOW);
  bool resetPressed = (digitalRead(resetPin) == LOW);
  
  switch (state) {
    case RESET_IDLE:
      // Wait for BOOT button press
      if (bootPressed && !bootLastState) {
        state = RESET_BOOT_PRESSED;
        bootPressTime = now;
        logger.info("========================================");
        logger.info("RESET: BOOT knop ingedrukt");
        logger.info("RESET: Druk nu RESET knop binnen " + String(bootWindowMs / 1000) + " seconden");
        logger.info("RESET: Houd RESET knop 3 seconden vast voor factory reset");
        logger.info("========================================");
      }
      break;
      
    case RESET_BOOT_PRESSED: {
      // LED slow blink while waiting for RESET button
      static unsigned long lastLedToggle = 0;
      if (now - lastLedToggle >= 500) {
        digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
        lastLedToggle = now;
      }
      
      // Check if boot window expired
      if (now - bootPressTime > bootWindowMs) {
        logger.info("RESET: Timeout - reset geannuleerd (geen RESET knop binnen " + String(bootWindowMs / 1000) + "s)");
        digitalWrite(LED_BUILTIN, LOW);
        state = RESET_IDLE;
        bootPressTime = 0;
        break;
      }
      
      // Check if RESET button pressed
      if (resetPressed && !resetLastState) {
        state = RESET_RESET_PRESSING;
        resetPressStartTime = now;
        logger.info("RESET: RESET knop ingedrukt - houd 3 seconden vast...");
        logger.info("RESET: LED knippert nu sneller - laat los om te annuleren");
        digitalWrite(LED_BUILTIN, HIGH); // Start with LED on
      }
      
      // Log remaining time every second
      unsigned long remaining = bootWindowMs - (now - bootPressTime);
      if (remaining % 1000 < 100 && remaining > 0) {
        unsigned int secLeft = remaining / 1000 + 1;
        if (secLeft <= 5 && secLeft > 0) {
          logger.info("RESET: Nog " + String(secLeft) + " seconde(n) om RESET knop in te drukken... (LED knippert langzaam)");
        }
      }
      break;
    }
      
    case RESET_RESET_PRESSING:
      // Check if RESET button released too early
      if (!resetPressed && resetLastState) {
        unsigned long holdTime = now - resetPressStartTime;
        logger.info("RESET: RESET knop losgelaten na " + String(holdTime) + "ms (niet lang genoeg)");
        logger.info("RESET: Reset geannuleerd - probeer opnieuw");
        // Turn off LED
        digitalWrite(LED_BUILTIN, LOW);
        state = RESET_IDLE;
        resetPressStartTime = 0;
        bootPressTime = 0;
        break;
      }
      
      // Check if RESET button held long enough
      if (resetPressed) {
        unsigned long holdTime = now - resetPressStartTime;
        
        // LED feedback: blink faster as we approach 3 seconds
        static unsigned long lastLedToggle = 0;
        bool ledState = false;
        if (holdTime < resetHoldTimeMs) {
          // Blink faster as we get closer to 3 seconds
          unsigned long blinkInterval = 200 - (holdTime * 150 / resetHoldTimeMs); // 200ms -> 50ms
          if (now - lastLedToggle >= blinkInterval) {
            ledState = !digitalRead(LED_BUILTIN);
            digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
            lastLedToggle = now;
          }
        } else {
          // Solid on when 3 seconds reached
          digitalWrite(LED_BUILTIN, HIGH);
        }
        
        // Log progress every second
        if (holdTime % 1000 < 100 && holdTime > 500) {
          unsigned int secondsLeft = (resetHoldTimeMs - holdTime) / 1000 + 1;
          if (secondsLeft <= 3 && secondsLeft > 0) {
            logger.info("RESET: Nog " + String(secondsLeft) + " seconde(n) vasthouden... (LED knippert)");
          }
        }
        
        // Check if hold time exceeded
        if (holdTime >= resetHoldTimeMs) {
          state = RESET_TRIGGERED;
          // LED solid on + 5 quick blinks for confirmation
          digitalWrite(LED_BUILTIN, HIGH);
          delay(200);
          for (int i = 0; i < 5; i++) {
            digitalWrite(LED_BUILTIN, LOW);
            delay(100);
            digitalWrite(LED_BUILTIN, HIGH);
            delay(100);
          }
          logger.warn("========================================");
          logger.warn("RESET: Factory reset getriggerd!");
          logger.warn("RESET: Twee-staps sequentie voltooid");
          logger.warn("RESET: BOOT + RESET (3s) = NVS wordt gewist");
          logger.warn("RESET: LED heeft 5x geknipperd als bevestiging");
          logger.warn("========================================");
          return true;
        }
      }
      break;
      
    case RESET_TRIGGERED:
      // Already triggered, return true
      return true;
  }
  
  bootLastState = bootPressed;
  resetLastState = resetPressed;
  return false;
}

bool ResetButtonHandler::check() {
  // Backward compatibility: simple single-button check using resetPin
  bool currentState = digitalRead(resetPin);
  unsigned long now = millis();
  
  // Button pressed (LOW = pressed with INPUT_PULLUP)
  if (currentState == LOW && resetLastState == HIGH) {
    resetPressStartTime = now;
    logger.info("RESET: Knop ingedrukt - houd " + String(resetHoldTimeMs / 1000) + " seconden vast voor factory reset");
  }
  
  // Button held down
  if (currentState == LOW && resetPressStartTime > 0) {
    unsigned long holdTime = now - resetPressStartTime;
    
    // Log progress every second
    if (holdTime % 1000 < 50 && holdTime > 500) {
      unsigned int secondsLeft = (resetHoldTimeMs - holdTime) / 1000 + 1;
      if (secondsLeft <= 3 && secondsLeft > 0) {
        logger.info("RESET: Nog " + String(secondsLeft) + " seconde(n) vasthouden...");
      }
    }
    
    // Check if hold time exceeded
    if (holdTime >= resetHoldTimeMs) {
      logger.warn("========================================");
      logger.warn("RESET: Factory reset getriggerd!");
      logger.warn("RESET: Knop " + String(resetHoldTimeMs / 1000) + " seconden ingedrukt");
      logger.warn("========================================");
      resetPressStartTime = 0;
      return true;
    }
  }
  
  // Button released
  if (currentState == HIGH && resetLastState == LOW) {
    if (resetPressStartTime > 0) {
      unsigned long holdTime = now - resetPressStartTime;
      logger.info("RESET: Knop losgelaten na " + String(holdTime) + "ms (reset geannuleerd)");
    }
    resetPressStartTime = 0;
  }
  
  resetLastState = currentState;
  return false;
}

void ResetButtonHandler::reset() {
  state = RESET_IDLE;
  bootPressTime = 0;
  resetPressStartTime = 0;
  bootLastState = digitalRead(bootPin);
  resetLastState = digitalRead(resetPin);
}

ResetState ResetButtonHandler::getState() {
  return state;
}

unsigned long ResetButtonHandler::getBootWindowRemaining() {
  if (state != RESET_BOOT_PRESSED || bootPressTime == 0) {
    return 0;
  }
  unsigned long elapsed = millis() - bootPressTime;
  if (elapsed >= bootWindowMs) {
    return 0;
  }
  return bootWindowMs - elapsed;
}
