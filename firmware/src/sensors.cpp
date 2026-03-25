#include "sensors.h"

Sensors::Sensors() {}

bool Sensors::init() {
  // Alleen deur: pull-up, contact open = HIGH = deur open
  pinMode(PIN_DOOR, INPUT_PULLUP);
  return true;
}

SensorData Sensors::read() {
  SensorData data = {0.0f, false, false, false};
  data.doorPinHigh = (digitalRead(PIN_DOOR) == HIGH);
  data.doorOpen = PIN_DOOR_INVERTED ? !data.doorPinHigh : data.doorPinHigh;
  return data;
}

bool Sensors::readDoorOnly() {
  bool pinHigh = (digitalRead(PIN_DOOR) == HIGH);
  return PIN_DOOR_INVERTED ? !pinHigh : pinHigh;
}
