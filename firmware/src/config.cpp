#include "config.h"

ConfigManager::ConfigManager() : loaded(false) {
  // Don't open preferences here - open when needed in load/save
  // This prevents issues with Preferences being opened too early
}

ConfigManager::~ConfigManager() {
  // Don't close preferences here - keep them open for the lifetime of the object
  // preferences.end();
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
  
  // Modbus/RS485 defaults: DI=GPIO17, RO=GPIO16, DE&RE=GPIO4
  configDoc["modbus"]["rxPin"] = 16;   // RO (Receiver Output)
  configDoc["modbus"]["txPin"] = 17;  // DI (Driver Input)
  configDoc["modbus"]["dePin"] = 4;   // DE & RE (same pin)
  configDoc["modbus"]["rePin"] = 4;
  configDoc["modbus"]["baudRate"] = 9600;
  configDoc["modbus"]["slaveId"] = 1;
  configDoc["modbus"]["writeEnabled"] = true;  // Ontdooiing vereist schrijven
}

bool ConfigManager::load() {
  // Ensure preferences namespace is open
  if (!preferences.begin(CONFIG_NAMESPACE, false)) {
    Serial.println("ERROR: Failed to open preferences namespace!");
    return false;
  }
  
  // Try getString first (simpler and more reliable)
  String configJson = preferences.getString(CONFIG_KEY, "");
  
  if (configJson.length() == 0) {
    // Try getBytes as fallback
    size_t len = preferences.getBytesLength(CONFIG_KEY);
    if (len > 0 && len < 2000) {
      char* buffer = (char*)malloc(len + 1);
      if (buffer) {
        size_t readLen = preferences.getBytes(CONFIG_KEY, (uint8_t*)buffer, len);
        buffer[readLen] = '\0';
        configJson = String(buffer);
        free(buffer);
      }
    }
  }
  
  if (configJson.length() == 0) {
    Serial.println("Config: No saved configuration found");
    return false;
  }
  
  Serial.println("Config: Loading from NVS, length: " + String(configJson.length()));
  Serial.println("Config JSON preview: " + configJson.substring(0, min(150, (int)configJson.length())));
  
  DeserializationError error = deserializeJson(configDoc, configJson);
  if (error) {
    Serial.println("Config: JSON parse error: " + String(error.c_str()));
    Serial.println("Config JSON: " + configJson);
    return false;
  }
  
  loaded = true;
  Serial.println("Config: Successfully loaded from NVS");
  
  // Log loaded values for debugging
  String apiUrl = configDoc["apiUrl"] | DEFAULT_API_URL;
  String apiKey = configDoc["apiKey"] | DEFAULT_API_KEY;
  Serial.println("Loaded API URL: " + apiUrl);
  Serial.println("Loaded API Key: " + (apiKey.length() > 0 ? String(apiKey.substring(0, 8)) + "..." : "(leeg)"));
  
  return true;
}

bool ConfigManager::save() {
  // Close any existing preferences session
  preferences.end();
  delay(10);
  
  // Open preferences namespace in read-write mode
  if (!preferences.begin(CONFIG_NAMESPACE, false)) {
    Serial.println("ERROR: Failed to open preferences namespace for save!");
    return false;
  }
  
  String configJson;
  serializeJson(configDoc, configJson);
  
  if (configJson.length() == 0) {
    Serial.println("ERROR: Config JSON is empty!");
    preferences.end();
    return false;
  }
  
  if (configJson.length() > 2000) {
    Serial.println("ERROR: Config JSON too large: " + String(configJson.length()));
    preferences.end();
    return false;
  }
  
  Serial.println("Config: Saving to NVS, length: " + String(configJson.length()));
  Serial.println("Free heap before save: " + String(ESP.getFreeHeap()));
  
  // Use putString (most reliable method for ESP32 Preferences)
  size_t written = preferences.putString(CONFIG_KEY, configJson);
  
  if (written == 0) {
    Serial.println("ERROR: putString returned 0 - trying alternative method...");
    // Try removing old key first
    preferences.remove(CONFIG_KEY);
    delay(10);
    written = preferences.putString(CONFIG_KEY, configJson);
  }
  
  if (written > 0) {
    Serial.println("Config: Successfully saved " + String(written) + " bytes to NVS");
    
    // Close and reopen to force commit
    preferences.end();
    delay(50); // Give flash time to write
    
    // Reopen and verify
    if (preferences.begin(CONFIG_NAMESPACE, false)) {
      String verifyJson = preferences.getString(CONFIG_KEY, "");
      if (verifyJson.length() > 0) {
        Serial.println("Config: Verification OK - " + String(verifyJson.length()) + " bytes read back");
        if (verifyJson == configJson) {
          Serial.println("Config: Content verification OK!");
        } else {
          Serial.println("WARNING: Content differs but data was saved");
        }
        preferences.end();
        return true;
      } else {
        Serial.println("WARNING: Saved but could not verify (empty read)");
        preferences.end();
        return true; // Assume success
      }
    } else {
      Serial.println("WARNING: Could not reopen for verification, but save returned success");
      return true;
    }
  } else {
    Serial.println("ERROR: Failed to save config to NVS!");
    Serial.println("  Free heap: " + String(ESP.getFreeHeap()));
    Serial.println("  Config length: " + String(configJson.length()));
    preferences.end();
    return false;
  }
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
  if (configDoc.containsKey("apiUrl")) {
    String url = configDoc["apiUrl"].as<String>();
    if (url.length() > 0 && url != DEFAULT_API_URL) {
      return url;
    }
  }
  return DEFAULT_API_URL;
}

void ConfigManager::setAPIUrl(String url) {
  if (url.length() > 0) {
    configDoc["apiUrl"] = url;
    Serial.println("Config: API URL set to: " + url);
  } else {
    Serial.println("WARNING: Attempted to set empty API URL!");
  }
}

String ConfigManager::getAPIKey() {
  if (configDoc.containsKey("apiKey")) {
    String key = configDoc["apiKey"].as<String>();
    return key;
  }
  return DEFAULT_API_KEY;
}

void ConfigManager::setAPIKey(String key) {
  if (key.length() > 0) {
    configDoc["apiKey"] = key;
    Serial.println("Config: API Key set (length: " + String(key.length()) + ")");
  } else {
    Serial.println("WARNING: Attempted to set empty API Key!");
    // Don't set empty key - keep existing value
  }
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
  config.rePin = configDoc["modbus"]["rePin"] | 4;
  config.baudRate = configDoc["modbus"]["baudRate"] | 9600;
  config.slaveId = configDoc["modbus"]["slaveId"] | 1;
  config.writeEnabled = configDoc["modbus"]["writeEnabled"] | true;
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
  return configDoc["modbus"]["writeEnabled"] | true;
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
