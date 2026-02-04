#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <Preferences.h>
#include <ArduinoJson.h>

#define FIRMWARE_VERSION "1.0.0"
#define CONFIG_NAMESPACE "coldmonitor"
#define CONFIG_KEY "config"

// Default configuration values
#define DEFAULT_DEVICE_SERIAL "ESP32-XXXXXX"
#define DEFAULT_READING_INTERVAL 60        // seconds
#define DEFAULT_UPLOAD_INTERVAL 300        // seconds (5 minutes)
#define DEFAULT_API_URL "http://localhost:3001/api"
#define DEFAULT_API_KEY ""
#define DEFAULT_MODBUS_ENABLED false
#define DEFAULT_MODBUS_INTERVAL 30         // seconds
#define DEFAULT_DEEP_SLEEP_ENABLED false
#define DEFAULT_DEEP_SLEEP_DURATION 3600   // seconds (1 hour)
#define DEFAULT_OTA_PASSWORD "coldmonitor"

// SPI Configuration for MAX31865
struct SPIConfig {
  uint8_t csPin;
  uint8_t rtdNominal;
  uint8_t refResistor;
  uint8_t wires;
};

// Modbus Configuration
struct ModbusConfig {
  uint8_t rxPin;
  uint8_t txPin;
  uint8_t dePin;
  uint8_t rePin;
  uint32_t baudRate;
  uint8_t slaveId;
  bool writeEnabled;
};

#define CONFIG_JSON_SIZE 2048

class ConfigManager {
private:
  Preferences preferences;
  DynamicJsonDocument configDoc{CONFIG_JSON_SIZE};
  bool loaded;
  
public:
  ConfigManager();
  ~ConfigManager();
  
  void setDefaults();
  bool load();
  bool save();
  void reset();
  
  // Device settings
  String getDeviceSerial();
  void setDeviceSerial(String serial);
  
  // Reading settings
  unsigned long getReadingInterval();
  void setReadingInterval(unsigned long interval);
  
  // Upload settings
  unsigned long getUploadInterval();
  void setUploadInterval(unsigned long interval);
  String getAPIUrl();
  void setAPIUrl(String url);
  String getAPIKey();
  void setAPIKey(String key);
  
  // Modbus settings
  bool getModbusEnabled();
  void setModbusEnabled(bool enabled);
  unsigned long getModbusInterval();
  void setModbusInterval(unsigned long interval);
  ModbusConfig getModbusConfig();
  void setModbusConfig(ModbusConfig config);
  bool getModbusWriteEnabled();
  void setModbusWriteEnabled(bool enabled);
  
  // Power management
  bool getDeepSleepEnabled();
  void setDeepSleepEnabled(bool enabled);
  unsigned long getDeepSleepDuration();
  void setDeepSleepDuration(unsigned long duration);
  
  // SPI configuration
  SPIConfig getSPIConfig();
  void setSPIConfig(SPIConfig config);
  
  // OTA settings
  String getOTAPassword();
  void setOTAPassword(String password);
  
  // Get full config as JSON
  String toJSON();
  bool fromJSON(String json);
};

#endif
