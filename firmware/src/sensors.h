#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include "board_pins.h"

#define PIN_DOOR BOARD_DOOR_PIN

// Deur: INPUT_PULLUP. Schakelaar gesloten (pin→GND) = LOW = deur dicht. Schakelaar open = HIGH = deur open.
// Als bij jou de melding verkeerd om staat: zet PIN_DOOR_INVERTED op 1.
#define PIN_DOOR_INVERTED 0  // 0 = LOW=dicht HIGH=open; 1 = omgekeerd

struct SensorData {
  float temperature;  // Alleen gebruikt door main (MAX31865); sensors.read zet 0
  bool doorOpen;      // true = deur open (na eventuele invert)
  bool doorPinHigh;   // ruwe GPIO (1=HIGH, 0=LOW) voor debug
  bool valid;         // true als MAX31865 geldige temperatuur levert (main zet dit)
};

class Sensors {
 public:
  Sensors();
  bool init();
  SensorData read();
  bool readDoorOnly();
};

#endif
