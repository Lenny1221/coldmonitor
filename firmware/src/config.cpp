#include "config.h"

ConfigManager::ConfigManager() : loaded(false) {
  preferences.begin(CONFIG_NAMESPACE, false);
}

ConfigManager::~ConfigManager() {
  preferences.end();
}

void ConfigManager::setDefaults() {
  configDoc["deviceSerial"] = DEFAULT_DEVICE_SERIAL;
  configDoc["readingInterval"] = DEFAULT_READING_INTERVAL;
  configDoc["uploadInterval"] = DEFAULT_UPLOAD_INTERVAL;
  configDoc["apiUrl"] = DEFAULT_API_URL;
  configDoc["apiKey"] = DEFAULT_API_KEY;
  configDoc["modbusEnabled"] = DEFAULT_MODBUS_ENABLED;
  configDoc["modbusInterval"] = DEFAULT_MODBUS_INTERVAL;
  configDoc["deepSleepEnabled"] = DEFAULT_DEEP_SLEEP_ENABLED;
  configDoc["deepSleepDuration"] = DEFAULT_DEEP_SLEEP_DURATION;
  configDoc["otaPassword"] = DEFAULT_OTA_PASSWORD;
  
  // SPI defaults
  configDoc["spi"]["csPin"] = 5;
  configDoc["spi"]["rtdNominal"] = 1000;  // PT1000
  configDoc["spi"]["refResistor"] = 4300;
  configDoc["spi"]["wires"] = 4;
  
  // Modbus defaults
  configDoc["modbus"]["rxPin"] = 16;
  configDoc["modbus"]["txPin"] = 17;
  configDoc["modbus"]["dePin"] = 4;
  configDoc["modbus"]["rePin"] = 0;
  configDoc["modbus"]["baudRate"] = 9600;
  configDoc["modbus"]["slaveId"] = 1;
  configDoc["modbus"]["writeEnabled"] = false;
}

bool ConfigManager::load() {
  String configJson = preferences.getString(CONFIG_KEY, "");
  
  if (configJson.length() == 0) {
    return false;
  }
  
  DeserializationError error = deserializeJson(configDoc, configJson);
  if (error) {
    return false;
  }
  
  loaded = true;
  return true;
}

bool ConfigManager::save() {
  String configJson;
  serializeJson(configDoc, configJson);
  
  return preferences.putString(CONFIG_KEY, configJson) > 0;
}

void ConfigManager::reset() {
  preferences.remove(CONFIG_KEY);
  setDefaults();
  save();
}

String ConfigManager::getDeviceSerial() {
  return configDoc["deviceSerial"] | DEFAULT_DEVICE_SERIAL;
}

void ConfigManager::setDeviceSerial(String serial) {
  configDoc["deviceSerial"] = serial;
}

unsigned long ConfigManager::getReadingInterval() {
  return configDoc["readingInterval"] | DEFAULT_READING_INTERVAL;
}

void ConfigManager::setReadingInterval(unsigned long interval) {
  configDoc["readingInterval"] = interval;
}

unsigned long ConfigManager::getUploadInterval() {
  return configDoc["uploadInterval"] | DEFAULT_UPLOAD_INTERVAL;
}

void ConfigManager::setUploadInterval(unsigned long interval) {
  configDoc["uploadInterval"] = interval;
}

String ConfigManager::getAPIUrl() {
  return configDoc["apiUrl"] | DEFAULT_API_URL;
}

void ConfigManager::setAPIUrl(String url) {
  configDoc["apiUrl"] = url;
}

String ConfigManager::getAPIKey() {
  return configDoc["apiKey"] | DEFAULT_API_KEY;
}

void ConfigManager::setAPIKey(String key) {
  configDoc["apiKey"] = key;
}

bool ConfigManager::getModbusEnabled() {
  return configDoc["modbusEnabled"] | DEFAULT_MODBUS_ENABLED;
}

void ConfigManager::setModbusEnabled(bool enabled) {
  configDoc["modbusEnabled"] = enabled;
}

unsigned long ConfigManager::getModbusInterval() {
  return configDoc["modbusInterval"] | DEFAULT_MODBUS_INTERVAL;
}

void ConfigManager::setModbusInterval(unsigned long interval) {
  configDoc["modbusInterval"] = interval;
}

ModbusConfig ConfigManager::getModbusConfig() {
  ModbusConfig config;
  config.rxPin = configDoc["modbus"]["rxPin"] | 16;
  config.txPin = configDoc["modbus"]["txPin"] | 17;
  config.dePin = configDoc["modbus"]["dePin"] | 4;
  config.rePin = configDoc["modbus"]["rePin"] | 0;
  config.baudRate = configDoc["modbus"]["baudRate"] | 9600;
  config.slaveId = configDoc["modbus"]["slaveId"] | 1;
  config.writeEnabled = configDoc["modbus"]["writeEnabled"] | false;
  return config;
}

void ConfigManager::setModbusConfig(ModbusConfig config) {
  configDoc["modbus"]["rxPin"] = config.rxPin;
  configDoc["modbus"]["txPin"] = config.txPin;
  configDoc["modbus"]["dePin"] = config.dePin;
  configDoc["modbus"]["rePin"] = config.rePin;
  configDoc["modbus"]["baudRate"] = config.baudRate;
  configDoc["modbus"]["slaveId"] = config.slaveId;
  configDoc["modbus"]["writeEnabled"] = config.writeEnabled;
}

bool ConfigManager::getModbusWriteEnabled() {
  return configDoc["modbus"]["writeEnabled"] | false;
}

void ConfigManager::setModbusWriteEnabled(bool enabled) {
  configDoc["modbus"]["writeEnabled"] = enabled;
}

bool ConfigManager::getDeepSleepEnabled() {
  return configDoc["deepSleepEnabled"] | DEFAULT_DEEP_SLEEP_ENABLED;
}

void ConfigManager::setDeepSleepEnabled(bool enabled) {
  configDoc["deepSleepEnabled"] = enabled;
}

unsigned long ConfigManager::getDeepSleepDuration() {
  return configDoc["deepSleepDuration"] | DEFAULT_DEEP_SLEEP_DURATION;
}

void ConfigManager::setDeepSleepDuration(unsigned long duration) {
  configDoc["deepSleepDuration"] = duration;
}

SPIConfig ConfigManager::getSPIConfig() {
  SPIConfig config;
  config.csPin = configDoc["spi"]["csPin"] | 5;
  config.rtdNominal = configDoc["spi"]["rtdNominal"] | 1000;
  config.refResistor = configDoc["spi"]["refResistor"] | 4300;
  config.wires = configDoc["spi"]["wires"] | 4;
  return config;
}

void ConfigManager::setSPIConfig(SPIConfig config) {
  configDoc["spi"]["csPin"] = config.csPin;
  configDoc["spi"]["rtdNominal"] = config.rtdNominal;
  configDoc["spi"]["refResistor"] = config.refResistor;
  configDoc["spi"]["wires"] = config.wires;
}

String ConfigManager::getOTAPassword() {
  return configDoc["otaPassword"] | DEFAULT_OTA_PASSWORD;
}

void ConfigManager::setOTAPassword(String password) {
  configDoc["otaPassword"] = password;
}

String ConfigManager::toJSON() {
  String json;
  serializeJson(configDoc, json);
  return json;
}

bool ConfigManager::fromJSON(String json) {
  DeserializationError error = deserializeJson(configDoc, json);
  return !error;
}
