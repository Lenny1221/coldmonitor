#ifndef MAX31865_DRIVER_H
#define MAX31865_DRIVER_H

#include <Arduino.h>
#include <SPI.h>
#include "config.h"

// MAX31865 Register Addresses
#define MAX31865_CONFIG_REG      0x00
#define MAX31865_RTD_MSB_REG     0x01
#define MAX31865_RTD_LSB_REG     0x02
#define MAX31865_HIGH_FAULT_MSB  0x03
#define MAX31865_HIGH_FAULT_LSB  0x04
#define MAX31865_LOW_FAULT_MSB   0x05
#define MAX31865_LOW_FAULT_LSB   0x06
#define MAX31865_FAULT_STATUS    0x07

// Configuration bits
#define MAX31865_CONFIG_50HZ     0x01
#define MAX31865_CONFIG_FAULT    0x02
#define MAX31865_CONFIG_FAULTCLR 0x04
#define MAX31865_CONFIG_1SHOT    0x20
#define MAX31865_CONFIG_3WIRE    0x10
#define MAX31865_CONFIG_BIAS     0x80

class MAX31865Driver {
private:
  SPIConfig spiConfig;
  uint8_t csPin;
  bool initialized;
  
  uint8_t readRegister(uint8_t address);
  void writeRegister(uint8_t address, uint8_t value);
  uint16_t readRTD();
  
public:
  MAX31865Driver();
  ~MAX31865Driver();
  
  bool init(SPIConfig config);
  float readTemperature();
  bool isValid();
  uint8_t getFaultStatus();
  void clearFaults();
  void setBias(bool enable);
  void setAutoConvert(bool enable);
};

#endif
