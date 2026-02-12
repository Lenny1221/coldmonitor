#include "reset_button.h"
#include "logger.h"

extern Logger logger;

ResetButtonHandler::ResetButtonHandler(uint8_t resetPin, unsigned long holdTime) 
  : pin(resetPin), holdTimeMs(holdTime), lastState(HIGH), pressStartTime(0), triggered(false) {
  pinMode(pin, INPUT_PULLUP);
  delay(10); // Stabilize pin
  lastState = digitalRead(pin);
}

bool ResetButtonHandler::check() {
  bool currentState = digitalRead(pin);
  unsigned long now = millis();
  
  // Button pressed (LOW = pressed with INPUT_PULLUP)
  if (currentState == LOW && lastState == HIGH) {
    // Button just pressed
    pressStartTime = now;
    logger.info("RESET: Knop ingedrukt - houd " + String(holdTimeMs / 1000) + " seconden vast voor factory reset");
  }
  
  // Button held down
  if (currentState == LOW && pressStartTime > 0) {
    unsigned long holdTime = now - pressStartTime;
    
    // Log progress every second
    if (holdTime % 1000 < 50 && holdTime > 500) {
      unsigned int secondsLeft = (holdTimeMs - holdTime) / 1000 + 1;
      if (secondsLeft <= 3 && secondsLeft > 0) {
        logger.info("RESET: Nog " + String(secondsLeft) + " seconde(n) vasthouden...");
      }
    }
    
    // Check if hold time exceeded
    if (holdTime >= holdTimeMs && !triggered) {
      triggered = true;
      logger.warn("========================================");
      logger.warn("RESET: Factory reset getriggerd!");
      logger.warn("RESET: Knop " + String(holdTimeMs / 1000) + " seconden ingedrukt");
      logger.warn("========================================");
      return true;
    }
  }
  
  // Button released
  if (currentState == HIGH && lastState == LOW) {
    if (pressStartTime > 0 && !triggered) {
      unsigned long holdTime = now - pressStartTime;
      logger.info("RESET: Knop losgelaten na " + String(holdTime) + "ms (reset geannuleerd)");
    }
    pressStartTime = 0;
    triggered = false;
  }
  
  lastState = currentState;
  return false;
}

void ResetButtonHandler::reset() {
  pressStartTime = 0;
  triggered = false;
  lastState = digitalRead(pin);
}

bool ResetButtonHandler::isPressed() {
  return digitalRead(pin) == LOW;
}

unsigned long ResetButtonHandler::getHoldTime() {
  if (pressStartTime == 0) {
    return 0;
  }
  return millis() - pressStartTime;
}
