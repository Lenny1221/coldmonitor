#include "max31865_driver.h"
#include "logger.h"

extern Logger logger;

MAX31865Driver::MAX31865Driver() : initialized(false), csPin(5) {
}

MAX31865Driver::~MAX31865Driver() {
}

bool MAX31865Driver::init(SPIConfig config) {
  spiConfig = config;
  csPin = config.csPin;
  
  // Initialize SPI
  SPI.begin();
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE1));
  
  // Configure CS pin
  pinMode(csPin, OUTPUT);
  digitalWrite(csPin, HIGH);
  
  delay(100);
  
  // Configure MAX31865
  uint8_t configValue = 0;
  
  // Set 50Hz filter
  configValue |= MAX31865_CONFIG_50HZ;
  
  // Set wire configuration (2, 3, or 4 wire)
  if (config.wires == 3) {
    configValue |= MAX31865_CONFIG_3WIRE;
  }
  
  // Enable bias
  configValue |= MAX31865_CONFIG_BIAS;
  
  // Enable auto-convert
  configValue |= MAX31865_CONFIG_1SHOT;
  
  writeRegister(MAX31865_CONFIG_REG, configValue);
  
  delay(100);
  
  // Clear any faults
  clearFaults();
  
  // Test read
  float temp = readTemperature();
  if (temp > -200 && temp < 200) {
    initialized = true;
    logger.info("MAX31865 initialized successfully");
    logger.info("RTD Nominal: " + String(config.rtdNominal) + "Ω");
    logger.info("Reference Resistor: " + String(config.refResistor) + "Ω");
    logger.info("Wires: " + String(config.wires));
    return true;
  }
  
  logger.error("MAX31865 initialization failed - invalid reading");
  return false;
}

uint8_t MAX31865Driver::readRegister(uint8_t address) {
  digitalWrite(csPin, LOW);
  delayMicroseconds(10);
  
  SPI.transfer(address & 0x7F); // Read operation
  uint8_t value = SPI.transfer(0x00);
  
  digitalWrite(csPin, HIGH);
  delayMicroseconds(10);
  
  return value;
}

void MAX31865Driver::writeRegister(uint8_t address, uint8_t value) {
  digitalWrite(csPin, LOW);
  delayMicroseconds(10);
  
  SPI.transfer(address | 0x80); // Write operation
  SPI.transfer(value);
  
  digitalWrite(csPin, HIGH);
  delayMicroseconds(10);
}

uint16_t MAX31865Driver::readRTD() {
  // Trigger one-shot conversion
  uint8_t config = readRegister(MAX31865_CONFIG_REG);
  config |= MAX31865_CONFIG_1SHOT;
  writeRegister(MAX31865_CONFIG_REG, config);
  
  // Wait for conversion (typically 52ms for 50Hz filter)
  delay(100);
  
  // Read RTD value
  uint8_t msb = readRegister(MAX31865_RTD_MSB_REG);
  uint8_t lsb = readRegister(MAX31865_RTD_LSB_REG);
  
  uint16_t rtd = (msb << 8) | lsb;
  rtd >>= 1; // Remove fault bit
  
  return rtd;
}

float MAX31865Driver::readTemperature() {
  if (!initialized) {
    return -999.0;
  }
  
  uint16_t rtd = readRTD();
  
  // Check for faults
  uint8_t fault = getFaultStatus();
  if (fault != 0) {
    logger.warn("MAX31865 fault detected: 0x" + String(fault, HEX));
    return -999.0;
  }
  
  // Convert RTD value to resistance
  float resistance = ((float)rtd * spiConfig.refResistor) / 32768.0;
  
  // Convert resistance to temperature using Callendar-Van Dusen equation
  // For PT1000: R0 = 1000Ω at 0°C
  float r0 = spiConfig.rtdNominal;
  float a = 3.9083e-3;
  float b = -5.775e-7;
  
  // Simplified calculation (for -200°C to 850°C)
  float temperature = (resistance / r0 - 1.0) / a;
  
  // More accurate calculation using Callendar-Van Dusen
  // For positive temperatures:
  if (temperature > 0) {
    float temp = (-a + sqrt(a * a - 4 * b * (1 - resistance / r0))) / (2 * b);
    temperature = temp;
  }
  
  return temperature;
}

bool MAX31865Driver::isValid() {
  if (!initialized) {
    return false;
  }
  
  uint8_t fault = getFaultStatus();
  return fault == 0;
}

uint8_t MAX31865Driver::getFaultStatus() {
  return readRegister(MAX31865_FAULT_STATUS);
}

void MAX31865Driver::clearFaults() {
  uint8_t config = readRegister(MAX31865_CONFIG_REG);
  config |= MAX31865_CONFIG_FAULTCLR;
  writeRegister(MAX31865_CONFIG_REG, config);
  delay(10);
}

void MAX31865Driver::setBias(bool enable) {
  uint8_t config = readRegister(MAX31865_CONFIG_REG);
  if (enable) {
    config |= MAX31865_CONFIG_BIAS;
  } else {
    config &= ~MAX31865_CONFIG_BIAS;
  }
  writeRegister(MAX31865_CONFIG_REG, config);
}

void MAX31865Driver::setAutoConvert(bool enable) {
  uint8_t config = readRegister(MAX31865_CONFIG_REG);
  if (enable) {
    config |= MAX31865_CONFIG_1SHOT;
  } else {
    config &= ~MAX31865_CONFIG_1SHOT;
  }
  writeRegister(MAX31865_CONFIG_REG, config);
}
