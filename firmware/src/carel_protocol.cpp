#include "carel_protocol.h"
#include "logger.h"
#include <HardwareSerial.h>

#define RESPONSE_TIMEOUT_MS 500

CarelProtocol::CarelProtocol() : serial(nullptr), dePin(0), address(1), initialized(false) {}

uint8_t CarelProtocol::carelCRC(uint8_t* data, int len) {
  uint8_t crc = 0;
  for (int i = 0; i < len; i++) crc ^= data[i];
  return crc;
}

void CarelProtocol::txMode() {
  digitalWrite(dePin, HIGH);
  delayMicroseconds(100);
}

void CarelProtocol::rxMode() {
  if (serial) {
    serial->flush();
  }
  delayMicroseconds(100);
  digitalWrite(dePin, LOW);
}

void CarelProtocol::flushRx() {
  if (serial) {
    while (serial->available()) serial->read();
  }
}

bool CarelProtocol::init(uint8_t rxPin, uint8_t txPin, uint8_t de) {
  dePin = de;
  pinMode(dePin, OUTPUT);
  digitalWrite(dePin, LOW);

  serial = &Serial2;
  // Carel: 1200 baud, 8 databits, no parity, 2 stopbits
  serial->begin(1200, SERIAL_8N2, rxPin, txPin);
  initialized = true;
  logger.info("Carel protocol initialized (1200 8N2)");
  return true;
}

bool CarelProtocol::writeDigital(int varIndex, uint8_t value) {
  if (!serial || !initialized) return false;
  uint8_t msg[8];
  msg[0] = 0x05;
  msg[1] = address;
  msg[2] = 0x57;  // 'W'
  msg[3] = 0x44;  // 'D'
  msg[4] = (varIndex >> 8) & 0xFF;
  msg[5] = varIndex & 0xFF;
  msg[6] = value;
  msg[7] = carelCRC(msg, 7);

  flushRx();
  txMode();
  serial->write(msg, 8);
  rxMode();

  unsigned long t = millis();
  while (millis() - t < RESPONSE_TIMEOUT_MS) {
    if (serial->available()) {
      uint8_t r = serial->read();
      if (r == 0x06) return true;
      if (r == 0x15) return false;
    }
  }
  return false;
}

bool CarelProtocol::writeInteger(int varIndex, int value) {
  if (!serial || !initialized) return false;
  uint8_t msg[9];
  msg[0] = 0x05;
  msg[1] = address;
  msg[2] = 0x57;
  msg[3] = 0x49;  // 'I'
  msg[4] = (varIndex >> 8) & 0xFF;
  msg[5] = varIndex & 0xFF;
  msg[6] = (value >> 8) & 0xFF;
  msg[7] = value & 0xFF;
  msg[8] = carelCRC(msg, 8);

  flushRx();
  txMode();
  serial->write(msg, 9);
  rxMode();

  unsigned long t = millis();
  while (millis() - t < RESPONSE_TIMEOUT_MS) {
    if (serial->available()) {
      uint8_t r = serial->read();
      if (r == 0x06) return true;
      if (r == 0x15) return false;
    }
  }
  return false;
}

int CarelProtocol::readInteger(int varIndex) {
  if (!serial || !initialized) return INT_MIN;
  uint8_t msg[7];
  msg[0] = 0x05;
  msg[1] = address;
  msg[2] = 0x52;  // 'R'
  msg[3] = 0x49;  // 'I'
  msg[4] = (varIndex >> 8) & 0xFF;
  msg[5] = varIndex & 0xFF;
  msg[6] = carelCRC(msg, 6);

  flushRx();
  txMode();
  serial->write(msg, 7);
  rxMode();

  uint8_t response[5];
  int received = 0;
  unsigned long t = millis();
  while (millis() - t < RESPONSE_TIMEOUT_MS && received < 5) {
    if (serial->available()) {
      response[received++] = serial->read();
    }
  }
  if (received < 5) return INT_MIN;
  if (carelCRC(response, 4) != response[4]) return INT_MIN;
  return (int16_t)((response[2] << 8) | response[3]);
}

float CarelProtocol::readTemperature() {
  int raw = readInteger(CAREL_TEMPERATURE);
  if (raw == INT_MIN) return NAN;
  return raw / 10.0f;
}

bool CarelProtocol::startDefrost() {
  return writeDigital(CAREL_DEFROST_CMD, 0x01);
}

bool CarelProtocol::stopDefrost() {
  return writeDigital(CAREL_DEFROST_CMD, 0x00);
}

bool CarelProtocol::readDefrostParams(int& type, int& interval, int& duration) {
  type = readInteger(CAREL_DEFROST_TYPE);
  interval = readInteger(CAREL_DEFROST_INTV);
  duration = readInteger(CAREL_DEFROST_DUR);
  return type != INT_MIN && interval != INT_MIN && duration != INT_MIN;
}

bool CarelProtocol::setDefrostInterval(int hours) {
  if (hours < 0 || hours > 199) return false;
  return writeInteger(CAREL_DEFROST_INTV, hours);
}

bool CarelProtocol::setDefrostDuration(int minutes) {
  if (minutes < 1 || minutes > 199) return false;
  return writeInteger(CAREL_DEFROST_DUR, minutes);
}

bool CarelProtocol::setDefrostType(int type) {
  if (type < 0 || type > 4) return false;
  return writeInteger(CAREL_DEFROST_TYPE, type);
}
