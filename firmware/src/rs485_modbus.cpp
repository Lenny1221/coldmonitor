#include "rs485_modbus.h"
#include "pins_carrier.h"
#include "logger.h"
#include "watchdog_tpl5010.h"
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

extern Logger logger;

// Max wachttijd op Modbus-antwoord (regelaar niet aangesloten = snel fail).
static constexpr unsigned long MODBUS_RX_DEADLINE_MS   = 350;
static constexpr unsigned long MODBUS_RX_INTERBYTE_MS  = 40;

static SemaphoreHandle_t s_busMutex = nullptr;

namespace {
int s_failStreak = 0;
unsigned long s_pausedUntil = 0;
bool s_lastOk = false;
constexpr int FAIL_LIMIT = 3;
constexpr unsigned long PAUSE_MS = 5UL * 60UL * 1000UL;

void onModbusResult(bool ok) {
  s_lastOk = ok;
  if (ok) {
    s_failStreak = 0;
    s_pausedUntil = 0;
    return;
  }
  if (++s_failStreak >= FAIL_LIMIT) {
    s_failStreak = 0;
    s_pausedUntil = millis() + PAUSE_MS;
    logger.info("[Modbus] geen regelaar — achtergrond-polling 5 min gepauzeerd");
  }
}

struct BusLock {
  bool held = false;
  BusLock() {
    if (s_busMutex) {
      held = (xSemaphoreTake(s_busMutex, pdMS_TO_TICKS(3000)) == pdTRUE);
    } else {
      held = true;
    }
  }
  ~BusLock() {
    if (held && s_busMutex) {
      xSemaphoreGive(s_busMutex);
    }
  }
  explicit operator bool() const { return held; }
};

void drainRx(HardwareSerial* serial) {
  if (!serial) return;
  while (serial->available()) {
    (void)serial->read();
  }
}
} // namespace

bool modbusBackgroundPollAllowed() {
  return millis() >= s_pausedUntil;
}

void modbusForceProbe() {
  s_pausedUntil = 0;
  s_failStreak = 0;
}

bool modbusControllerLikelyPresent() {
  return s_lastOk;
}

/* -------------------------- Carrier-API (free) ------------------------- */
namespace {
bool     s_carrierInitialized = false;
uint32_t s_carrierBaud        = 0;
} // namespace

uint32_t carrierRS485ActiveBaud() { return s_carrierBaud; }

void initRS485(uint32_t baud) {
  if (!s_busMutex) {
    s_busMutex = xSemaphoreCreateMutex();
  }
  if (s_carrierInitialized) return;
  pinMode(PIN_RS485_DE, OUTPUT);
  digitalWrite(PIN_RS485_DE, LOW);  // default: RX-mode
  Serial1.begin(baud, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);
  s_carrierInitialized = true;
  s_carrierBaud        = baud;
  logger.info("[RS485] ready @ " + String(baud) + " 8N1");
}

void rs485TxEnable(bool en) {
  digitalWrite(PIN_RS485_DE, en ? HIGH : LOW);
}

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
#if !defined(BOARD_LILYGO_T_SIM7670G_S3)
  // Op carrier v1.1 wijzen we naar de globale `Serial1`. Die mag NOOIT
  // worden geheap-deleted (segfault). Op andere boards gebruiken we een
  // dynamisch nieuwe HardwareSerial(2)-instantie.
  if (serial) {
    delete serial;
  }
#endif
}

bool RS485Modbus::init(ModbusConfig cfg) {
  config = cfg;
  dePin = cfg.dePin;
  rePin = cfg.rePin;

  // Initialize RS485 driver/receiver enable pins
  pinMode(dePin, OUTPUT);
  pinMode(rePin, OUTPUT);
  setTransmitMode(false);

#if defined(BOARD_LILYGO_T_SIM7670G_S3)
  // Carrier v1.1: de MAX3485 hangt aan UART1 (Serial1). UART2 (Serial2) is
  // gereserveerd voor de SIM7670G-modem (zie sim7670_battery.cpp). Als we
  // hier `new HardwareSerial(2)` zouden doen, herclaimen we UART2 op de
  // RS485-pinnen en valt de modem-link weg.
  //
  // Belangrijk: initRS485() heeft Serial1 al opgestart op de juiste pinnen
  // tijdens setup(). Een tweede `Serial1.begin()` met dezelfde baud triggert
  // hier een driver-uninstall/install in arduino-esp32, en in combinatie met
  // de modem die op UART2 al RX-bytes binnen pompt, blijken interrupts lang
  // genoeg geblokkeerd om de TG1-interrupt-watchdog te laten panieken
  // (resetreden TG1WDT_SYS_RST). We re-initialiseren Serial1 dus enkel als
  // de baud écht moet veranderen; in alle andere gevallen adopteren we de
  // bestaande UART-driver gewoon.
  serial = &Serial1;
  if (s_carrierBaud != cfg.baudRate) {
    Serial1.begin(cfg.baudRate, SERIAL_8N1, cfg.rxPin, cfg.txPin);
    s_carrierBaud = cfg.baudRate;
  }
#else
  // Klassieke ESP32-DevKit / SimShield-pad: dedicated UART2.
  if (!serial) {
    serial = new HardwareSerial(2);
  }
  serial->begin(cfg.baudRate, SERIAL_8N1, cfg.rxPin, cfg.txPin);
#endif

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
  drainRx(serial);
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
  (void)expectedBytes;
  if (!initialized || !serial) {
    return false;
  }
  
  const unsigned long deadline = millis() + MODBUS_RX_DEADLINE_MS;
  uint8_t buffer[256];
  uint8_t index = 0;
  unsigned long lastByteMs = 0;
  
  if (defrostDebug) {
    logger.info("[Modbus] Wachten op antwoord (max " + String(MODBUS_RX_DEADLINE_MS) + " ms)...");
  }
  
  // Harde deadline: nooit eindeloos wachten bij ruis of geen regelaar. Oude code
  // verlengde timeout bij elke byte → kon CPU 0 minutenlang blokkeren.
  while (millis() < deadline && index < 256) {
    if (serial->available()) {
      buffer[index++] = serial->read();
      lastByteMs = millis();
    } else if (index > 0 && (millis() - lastByteMs) >= MODBUS_RX_INTERBYTE_MS) {
      break;
    }
    vTaskDelay(1);
    kickWatchdog();
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
  BusLock lock;
  if (!lock) return false;
  bool ok = false;
  if (sendRequest(MODBUS_READ_HOLDING_REGISTERS, startAddress, quantity)) {
    vTaskDelay(pdMS_TO_TICKS(5));
    ok = receiveResponse(MODBUS_READ_HOLDING_REGISTERS, quantity * 2);
  }
  onModbusResult(ok);
  return ok;
}

bool RS485Modbus::readInputRegisters(uint16_t startAddress, uint16_t quantity) {
  BusLock lock;
  if (!lock) return false;
  bool ok = false;
  if (sendRequest(MODBUS_READ_INPUT_REGISTERS, startAddress, quantity)) {
    vTaskDelay(pdMS_TO_TICKS(5));
    ok = receiveResponse(MODBUS_READ_INPUT_REGISTERS, quantity * 2);
  }
  onModbusResult(ok);
  return ok;
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
  BusLock lock;
  if (!lock || !initialized || !serial) {
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
  drainRx(serial);
  setTransmitMode(true);
  delay(1);
  
  for (uint8_t i = 0; i < 8; i++) {
    serial->write(request[i]);
  }
  
  serial->flush();
  delay(1);
  setTransmitMode(false);
  
  vTaskDelay(pdMS_TO_TICKS(5));
  
  bool ok = receiveResponse(MODBUS_WRITE_SINGLE_REGISTER, 4);
  onModbusResult(ok);
  return ok;
}

bool RS485Modbus::writeMultipleRegisters(uint16_t startAddress, uint16_t* values, uint16_t quantity) {
  // Implementation for multiple register write
  return false;
}

bool RS485Modbus::writeSingleCoil(uint16_t address, bool value) {
  BusLock lock;
  if (!lock || !initialized || !serial) {
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
  drainRx(serial);
  setTransmitMode(true);
  delay(1);
  for (uint8_t i = 0; i < 8; i++) serial->write(request[i]);
  serial->flush();
  delay(1);
  setTransmitMode(false);
  vTaskDelay(pdMS_TO_TICKS(5));
  bool ok = receiveResponse(MODBUS_WRITE_SINGLE_COIL, 4);
  onModbusResult(ok);
  return ok;
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
