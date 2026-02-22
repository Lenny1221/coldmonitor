#ifndef CAREL_PROTOCOL_H
#define CAREL_PROTOCOL_H

#include <Arduino.h>

// Carel PJEZ Easy Cool – supervisie protocol
// 1200 baud, 8N2, half-duplex
// Pins: RX=16, TX=17, DE=4 (zelfde als Modbus)

#define CAREL_DEFROST_CMD   33   // Digital: 1=start, 0=stop
#define CAREL_TEMPERATURE    1   // Integer: x10 (235 = 23.5°C)
#define CAREL_DEFROST_TYPE   4   // Integer: 0-4
#define CAREL_DEFROST_INTV   5   // Integer: interval (uur)
#define CAREL_DEFROST_DUR    6   // Integer: max duur (min)

class CarelProtocol {
public:
  CarelProtocol();
  bool init(uint8_t rxPin, uint8_t txPin, uint8_t dePin);
  void setAddress(uint8_t addr) { address = addr; }

  // Defrost
  bool startDefrost();
  bool stopDefrost();

  // Read
  int readInteger(int varIndex);   // Returns INT_MIN on error
  float readTemperature();         // Returns NAN on error

  // Write
  bool writeDigital(int varIndex, uint8_t value);
  bool writeInteger(int varIndex, int value);

  // Params
  bool readDefrostParams(int& type, int& interval, int& duration);
  bool setDefrostInterval(int hours);
  bool setDefrostDuration(int minutes);
  bool setDefrostType(int type);

private:
  HardwareSerial* serial;
  uint8_t dePin;
  uint8_t address;
  bool initialized;

  uint8_t carelCRC(uint8_t* data, int len);
  void txMode();
  void rxMode();
  void flushRx();
};

#endif
