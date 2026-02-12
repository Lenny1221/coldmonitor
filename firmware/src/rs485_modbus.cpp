#include "rs485_modbus.h"
#include "logger.h"

extern Logger logger;

RS485Modbus::RS485Modbus() : serial(nullptr), initialized(false), dePin(0), rePin(0), responseLength(0), defrostDebug(false) {
}

String RS485Modbus::bytesToHex(uint8_t* data, uint8_t len) {
  String s;
  for (uint8_t i = 0; i < len && i < 32; i++) {
    if (i > 0) s += " ";
    if (data[i] < 16) s += "0";
    s += String(data[i], HEX);
  }
  return s;
}

RS485Modbus::~RS485Modbus() {
  if (serial) {
    delete serial;
  }
}

bool RS485Modbus::init(ModbusConfig cfg) {
  config = cfg;
  dePin = cfg.dePin;
  rePin = cfg.rePin;
  
  // Initialize RS485 driver/receiver enable pins
  pinMode(dePin, OUTPUT);
  pinMode(rePin, OUTPUT);
  setTransmitMode(false);
  
  // Initialize Serial2 for RS485
  serial = new HardwareSerial(2);
  serial->begin(cfg.baudRate, SERIAL_8N1, cfg.rxPin, cfg.txPin);
  
  delay(100);
  
  initialized = true;
  logger.info("RS485/Modbus initialized");
  logger.info("Baud: " + String(cfg.baudRate) + ", Slave ID: " + String(cfg.slaveId));
  
  return true;
}

void RS485Modbus::setTransmitMode(bool transmit) {
  digitalWrite(dePin, transmit ? HIGH : LOW);
  digitalWrite(rePin, transmit ? HIGH : LOW);
}

uint16_t RS485Modbus::calculateCRC(uint8_t* data, uint8_t length) {
  uint16_t crc = 0xFFFF;
  
  for (uint8_t i = 0; i < length; i++) {
    crc ^= data[i];
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  
  return crc;
}

bool RS485Modbus::sendRequest(uint8_t functionCode, uint16_t startAddress, uint16_t quantity) {
  if (!initialized || !serial) {
    return false;
  }
  
  uint8_t request[8];
  request[0] = config.slaveId;
  request[1] = functionCode;
  request[2] = (startAddress >> 8) & 0xFF;
  request[3] = startAddress & 0xFF;
  request[4] = (quantity >> 8) & 0xFF;
  request[5] = quantity & 0xFF;
  
  uint16_t crc = calculateCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;
  
  if (defrostDebug) {
    logger.info("[Modbus TX] " + String(functionCode, HEX) + " @ " + String(startAddress) + " | " + bytesToHex(request, 8));
  }
  setTransmitMode(true);
  delay(1);
  
  for (uint8_t i = 0; i < 8; i++) {
    serial->write(request[i]);
  }
  
  serial->flush();
  delay(1);
  setTransmitMode(false);
  
  return true;
}

bool RS485Modbus::receiveResponse(uint8_t expectedFunctionCode, uint16_t expectedBytes) {
  if (!initialized || !serial) {
    return false;
  }
  
  unsigned long timeout = millis() + 1000; // 1 second timeout
  uint8_t buffer[256];
  uint8_t index = 0;
  
  if (defrostDebug) {
    logger.info("[Modbus] Wachten op antwoord (max 1s)...");
  }
  
  while (millis() < timeout && index < 256) {
    if (serial->available()) {
      buffer[index++] = serial->read();
      timeout = millis() + 100; // Reset timeout on data received
    }
  }
  
  if (defrostDebug) {
    if (index == 0) {
      logger.info("[Modbus RX] TIMEOUT: geen bytes ontvangen");
      logger.info("  -> Controleer: A+ B- aangesloten? Slave ID=" + String(config.slaveId) + " op regelaar? Baud=" + String(config.baudRate) + "?");
      return false;
    }
    logger.info("[Modbus RX] " + String(index) + " bytes: " + bytesToHex(buffer, index));
  }
  
  if (index < 5) {
    if (defrostDebug) logger.info("[Modbus RX] Te kort antwoord (<5 bytes)");
    return false; // Minimum response length
  }
  
  // Check slave ID
  if (buffer[0] != config.slaveId) {
    if (defrostDebug) {
      logger.info("[Modbus RX] Fout: slave ID in antwoord (" + String(buffer[0]) + ") != verwacht (" + String(config.slaveId) + ")");
    } else {
      return false;
    }
    return false;
  }
  
  // Check function code
  if (buffer[1] & 0x80) {
    // Exception response
    const char* exc = "?";
    if (buffer[2] == 0x01) exc = "illegal function";
    else if (buffer[2] == 0x02) exc = "illegal data address";
    else if (buffer[2] == 0x03) exc = "illegal data value";
    else if (buffer[2] == 0x04) exc = "slave device failure";
    logger.warn("Modbus exception 0x" + String(buffer[2], HEX) + ": " + String(exc));
    if (defrostDebug) logger.info("  -> Adres niet ondersteund door regelaar?");
    return false;
  }
  
  if (buffer[1] != expectedFunctionCode) {
    if (defrostDebug) logger.info("[Modbus RX] Fout: function code " + String(buffer[1], HEX) + " != verwacht " + String(expectedFunctionCode, HEX));
    return false;
  }
  
  // Verify CRC
  uint16_t receivedCRC = (buffer[index - 1] << 8) | buffer[index - 2];
  uint16_t calculatedCRC = calculateCRC(buffer, index - 2);
  
  if (receivedCRC != calculatedCRC) {
    logger.warn("Modbus CRC error");
    if (defrostDebug) logger.info("  -> Elektrische storing of noise op RS485-lijn?");
    return false;
  }
  
  // Extract data (for read responses)
  responseLength = buffer[2] / 2; // Number of registers (2 bytes each)
  for (uint8_t i = 0; i < responseLength && i < 64; i++) {
    responseBuffer[i] = (buffer[3 + i * 2] << 8) | buffer[4 + i * 2];
  }
  
  if (defrostDebug) logger.info("[Modbus RX] OK");
  return true;
}

bool RS485Modbus::readHoldingRegisters(uint16_t startAddress, uint16_t quantity) {
  if (!sendRequest(MODBUS_READ_HOLDING_REGISTERS, startAddress, quantity)) {
    return false;
  }
  
  delay(50); // Wait for response
  
  return receiveResponse(MODBUS_READ_HOLDING_REGISTERS, quantity * 2);
}

bool RS485Modbus::readInputRegisters(uint16_t startAddress, uint16_t quantity) {
  if (!sendRequest(MODBUS_READ_INPUT_REGISTERS, startAddress, quantity)) {
    return false;
  }
  
  delay(50);
  
  return receiveResponse(MODBUS_READ_INPUT_REGISTERS, quantity * 2);
}

bool RS485Modbus::readCoils(uint16_t startAddress, uint16_t quantity) {
  // Similar implementation for coils
  return false;
}

bool RS485Modbus::readDiscreteInputs(uint16_t startAddress, uint16_t quantity) {
  // Similar implementation for discrete inputs
  return false;
}

bool RS485Modbus::writeSingleRegister(uint16_t address, uint16_t value) {
  if (!initialized || !serial) {
    return false;
  }
  
  uint8_t request[8];
  request[0] = config.slaveId;
  request[1] = MODBUS_WRITE_SINGLE_REGISTER;
  request[2] = (address >> 8) & 0xFF;
  request[3] = address & 0xFF;
  request[4] = (value >> 8) & 0xFF;
  request[5] = value & 0xFF;
  
  uint16_t crc = calculateCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;
  
  if (defrostDebug) {
    logger.info("[Modbus TX] FC06 WriteRegister addr=" + String(address) + " val=" + String(value) + " | " + bytesToHex(request, 8));
  }
  setTransmitMode(true);
  delay(1);
  
  for (uint8_t i = 0; i < 8; i++) {
    serial->write(request[i]);
  }
  
  serial->flush();
  delay(1);
  setTransmitMode(false);
  
  delay(50);
  
  // Read echo/response
  return receiveResponse(MODBUS_WRITE_SINGLE_REGISTER, 4);
}

bool RS485Modbus::writeMultipleRegisters(uint16_t startAddress, uint16_t* values, uint16_t quantity) {
  // Implementation for multiple register write
  return false;
}

bool RS485Modbus::writeSingleCoil(uint16_t address, bool value) {
  if (!initialized || !serial) {
    return false;
  }
  // Modbus FC 0x05: value 0xFF00 = ON, 0x0000 = OFF
  uint16_t coilValue = value ? 0xFF00 : 0x0000;
  uint8_t request[8];
  request[0] = config.slaveId;
  request[1] = MODBUS_WRITE_SINGLE_COIL;
  request[2] = (address >> 8) & 0xFF;
  request[3] = address & 0xFF;
  request[4] = (coilValue >> 8) & 0xFF;
  request[5] = coilValue & 0xFF;
  uint16_t crc = calculateCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;
  if (defrostDebug) {
    logger.info("[Modbus TX] FC05 WriteCoil addr=" + String(address) + " val=" + String(value ? "ON" : "OFF") + " | " + bytesToHex(request, 8));
  }
  setTransmitMode(true);
  delay(1);
  for (uint8_t i = 0; i < 8; i++) serial->write(request[i]);
  serial->flush();
  delay(1);
  setTransmitMode(false);
  delay(50);
  return receiveResponse(MODBUS_WRITE_SINGLE_COIL, 4);
}

bool RS485Modbus::writeMultipleCoils(uint16_t startAddress, bool* values, uint16_t quantity) {
  // Implementation for multiple coil write
  return false;
}

uint16_t RS485Modbus::getRegister(uint8_t index) {
  if (index < responseLength) {
    return responseBuffer[index];
  }
  return 0;
}

float RS485Modbus::getFloat(uint8_t index) {
  // Assumes 2 consecutive registers form IEEE 754 float
  if (index + 1 < responseLength) {
    union {
      uint32_t i;
      float f;
    } converter;
    
    converter.i = ((uint32_t)responseBuffer[index] << 16) | responseBuffer[index + 1];
    return converter.f;
  }
  return 0.0;
}

bool RS485Modbus::getBool(uint8_t index) {
  return getRegister(index) != 0;
}

int16_t RS485Modbus::getInt16(uint8_t index) {
  return (int16_t)getRegister(index);
}

uint16_t RS485Modbus::getUInt16(uint8_t index) {
  return getRegister(index);
}
