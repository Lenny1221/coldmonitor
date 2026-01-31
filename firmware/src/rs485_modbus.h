#ifndef RS485_MODBUS_H
#define RS485_MODBUS_H

#include <Arduino.h>
#include <HardwareSerial.h>
#include "config.h"

// Modbus RTU function codes
#define MODBUS_READ_COILS           0x01
#define MODBUS_READ_DISCRETE_INPUTS 0x02
#define MODBUS_READ_HOLDING_REGISTERS 0x03
#define MODBUS_READ_INPUT_REGISTERS 0x04
#define MODBUS_WRITE_SINGLE_COIL    0x05
#define MODBUS_WRITE_SINGLE_REGISTER 0x06
#define MODBUS_WRITE_MULTIPLE_COILS 0x0F
#define MODBUS_WRITE_MULTIPLE_REGISTERS 0x10

// Modbus exception codes
#define MODBUS_EXCEPTION_ILLEGAL_FUNCTION 0x01
#define MODBUS_EXCEPTION_ILLEGAL_DATA_ADDRESS 0x02
#define MODBUS_EXCEPTION_ILLEGAL_DATA_VALUE 0x03
#define MODBUS_EXCEPTION_SLAVE_DEVICE_FAILURE 0x04

class RS485Modbus {
private:
  HardwareSerial* serial;
  ModbusConfig config;
  uint8_t dePin;
  uint8_t rePin;
  bool initialized;
  
  uint16_t responseBuffer[64];
  uint8_t responseLength;
  
  void setTransmitMode(bool transmit);
  uint16_t calculateCRC(uint8_t* data, uint8_t length);
  bool sendRequest(uint8_t functionCode, uint16_t startAddress, uint16_t quantity);
  bool receiveResponse(uint8_t expectedFunctionCode, uint16_t expectedBytes);
  
public:
  RS485Modbus();
  ~RS485Modbus();
  
  bool init(ModbusConfig config);
  
  // Read functions
  bool readHoldingRegisters(uint16_t startAddress, uint16_t quantity);
  bool readInputRegisters(uint16_t startAddress, uint16_t quantity);
  bool readCoils(uint16_t startAddress, uint16_t quantity);
  bool readDiscreteInputs(uint16_t startAddress, uint16_t quantity);
  
  // Write functions
  bool writeSingleRegister(uint16_t address, uint16_t value);
  bool writeMultipleRegisters(uint16_t startAddress, uint16_t* values, uint16_t quantity);
  bool writeSingleCoil(uint16_t address, bool value);
  bool writeMultipleCoils(uint16_t startAddress, bool* values, uint16_t quantity);
  
  // Data access
  uint16_t getRegister(uint8_t index);
  float getFloat(uint8_t index);  // Assumes 2 consecutive registers (IEEE 754)
  bool getBool(uint8_t index);
  int16_t getInt16(uint8_t index);
  uint16_t getUInt16(uint8_t index);
};

#endif
