#include <Arduino.h>
#include <WiFi.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "config.h"
#include "logger.h"
#include "provisioning.h"
#include "reset_button.h"
#include "sensors.h"
#include "max31865_driver.h"
#include "rs485_modbus.h"
#include "data_buffer.h"
#include "wifi_manager.h"
#include "api_client.h"
#include "battery_monitor.h"
#include "door_events.h"
#include "boot_state.h"
#include "ota_update.h"
#include "power_manager.h"

// Global objects
ConfigManager config;
Logger logger;
ProvisioningManager provisioning;
// Two-step reset: BOOT button (GPIO 0) + RESET button (GPIO 0, same pin) within 10 seconds
ResetButtonHandler resetButton(DEFAULT_BOOT_PIN, DEFAULT_RESET_PIN, BOOT_WINDOW_MS, RESET_HOLD_TIME_MS);
Sensors sensors;
MAX31865Driver tempSensor;
RS485Modbus modbus;
DataBuffer dataBuffer;
WiFiManagerWrapper wifiManager;
APIClient apiClient;
BatteryMonitor batteryMonitor;
OTAUpdate otaUpdate;
PowerManager powerManager;
DoorEventManager doorEventManager;

// Task handles
TaskHandle_t sensorTaskHandle = NULL;
TaskHandle_t modbusTaskHandle = NULL;
TaskHandle_t uploadTaskHandle = NULL;
TaskHandle_t commandTaskHandle = NULL;

// WiFi status tracking
String lastWiFiSSID = "";
bool lastWiFiConnected = false;

// App-visible status (connected_to_wifi, connected_to_api, last_error)
DeviceStatus deviceStatus = { false, false, "", 0, 0 };

// Sensor reading structure
struct SensorReading {
  float temperature;
  uint32_t timestamp;
  uint8_t sensorId;
  bool valid;
};

// Modbus data structure
struct ModbusData {
  float setpoint;
  float currentTemp;
  bool compressorStatus;
  bool alarmStatus;
  uint32_t timestamp;
  bool valid;
};

// Door events: debounced, immediate POST, offline queue

// Function prototypes
void sensorTask(void *parameter);
void modbusTask(void *parameter);
void uploadTask(void *parameter);
void commandTask(void *parameter);
void setupWiFi();
void setupOTA();
void deepSleepIfNeeded();

// Serienummer voor deviceId: provisioning (ColdMonitor-setup) heeft voorrang, anders config
static String getEffectiveDeviceSerial() {
  String s = provisioning.getDeviceSerial();
  if (s.length() > 0) return s;
  return config.getDeviceSerial();
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);  // Brownout detector uit (voorkomt reset bij WiFi/AP stroompiek)
  
  Serial.begin(115200);
  delay(1000);
  
  // Boot banner
  logger.info("========================================");
  logger.info("=== ColdMonitor ESP32 Firmware ===");
  logger.info("Version: " + String(FIRMWARE_VERSION));
  logger.info("========================================");
  
  // Initialize LED
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    logger.error("SPIFFS initialization failed!");
    return;
  }
  logger.info("SPIFFS initialized");
  
  // Initialize Provisioning Manager
  if (!provisioning.begin()) {
    logger.error("CRITICAL: Provisioning manager initialization failed!");
    return;
  }
  
  // Log boot reason
  provisioning.logBootReason();
  
  // Check two-step reset BEFORE loading settings
  logger.info("RESET: Controleren twee-staps reset sequentie...");
  logger.info("RESET: Stap 1 = Druk BOOT knop");
  logger.info("RESET: Stap 2 = Binnen 10s, houd RESET knop 3s vast");
  delay(300); // Stabilize button
  
  // Check for two-step reset sequence
  unsigned long resetCheckStart = millis();
  const unsigned long resetCheckTimeout = 12000; // Check for 12 seconds max
  
  while (millis() - resetCheckStart < resetCheckTimeout) {
      if (resetButton.checkTwoStepReset()) {
        logger.warn("RESET: Factory reset getriggerd via twee-staps sequentie!");
        
        // Complete factory reset - wipe everything
        logger.warn("RESET: Uitvoeren volledige factory reset...");
        provisioning.factoryReset();
        wifiManager.resetSettings();
        
        // Additional WiFi stack reset
        logger.warn("RESET: WiFi stack volledig resetten...");
        WiFi.disconnect(true, true); // disconnect and erase credentials
        WiFi.mode(WIFI_OFF);
        delay(500);
        
        logger.warn("RESET: Herstarten in 2 seconden...");
        delay(2000);
        ESP.restart();
        return;
      }
    delay(50); // Small delay to prevent tight loop
  }
  
  // Load configuration
  if (!config.load()) {
    logger.warn("Config: Geen opgeslagen configuratie gevonden, gebruik defaults");
    config.setDefaults();
  } else {
    logger.info("Config: Configuratie geladen uit NVS");
  }
  
  // Log provisioning state
  provisioning.logProvisioningState();
  provisioning.logWiFiState();
  provisioning.logAPIState();
  
  // Debug: log deviceId die voor uploads wordt gebruikt
  String effSerial = getEffectiveDeviceSerial();
  logger.info("NVS: deviceId voor uploads = " + (effSerial.length() > 0 ? effSerial : "(LEEG - gebruik DEFAULT)"));
  
  // Set API client configuration from provisioning (preferred) or config manager (fallback)
  String apiUrl = provisioning.getAPIUrl();
  String apiKey = provisioning.getAPIKey();
  if (apiUrl.length() > 0 && apiKey.length() > 0) {
    apiClient.setAPIUrl(apiUrl);
    apiClient.setAPIKey(apiKey);
    logger.info("API: Client geconfigureerd vanuit provisioning");
  } else {
    // Fallback to config manager
    apiUrl = config.getAPIUrl();
    apiKey = config.getAPIKey();
    apiClient.setAPIUrl(apiUrl);
    apiClient.setAPIKey(apiKey);
    logger.warn("API: Gebruikt config manager (provisioning niet compleet)");
  }
  
  // WiFi Setup (with provisioning flow)
  setupWiFi();
  
  // Initialize components
  logger.info("Initializing hardware...");
  
  // BMP180 (I²C) + DHT11 + deurstatus
  if (sensors.init()) {
    logger.info("Sensors (BMP180, DHT11, door) initialized");
  } else {
    logger.warn("Sensors init failed, falling back to MAX31865");
  }
  
  // MAX31865 (SPI) - optioneel, alleen als geen nieuwe sensoren
  if (!tempSensor.init(config.getSPIConfig())) {
    logger.debug("MAX31865 not used (optional)");
  } else {
    logger.info("MAX31865 initialized");
  }
  
  // Initialize RS485/Modbus (optional)
  if (config.getModbusEnabled()) {
    if (modbus.init(config.getModbusConfig())) {
      logger.info("RS485/Modbus initialized");
    } else {
      logger.error("RS485/Modbus initialization failed!");
    }
  }
  
  // Initialize data buffer
  dataBuffer.init();
  logger.info("Data buffer initialized");
  
  // Initialize battery monitor
  batteryMonitor.init();
  logger.info("Battery monitor initialized");
  
  // Initialize power manager
  powerManager.init();
  logger.info("Power manager initialized");
  
  // Setup OTA (met delay om Invalid mbox crash te voorkomen)
  delay(500);  // Extra stabilisatie vóór netwerkinit
  setupOTA();
  
  // Create tasks
  xTaskCreatePinnedToCore(
    sensorTask,
    "SensorTask",
    4096,
    NULL,
    2,
    &sensorTaskHandle,
    1
  );
  
  if (config.getModbusEnabled()) {
    xTaskCreatePinnedToCore(
      modbusTask,
      "ModbusTask",
      4096,
      NULL,
      1,
      &modbusTaskHandle,
      0
    );
  }
  
  xTaskCreatePinnedToCore(
    uploadTask,
    "UploadTask",
    8192,
    NULL,
    1,
    &uploadTaskHandle,
    0
  );
  
  // Command task for handling RS485 commands (only if Modbus is enabled)
  // Note: Task will check conditions internally, but we only create it if Modbus might be used
  if (config.getModbusEnabled()) {
    xTaskCreatePinnedToCore(
      commandTask,
      "CommandTask",
      8192,  // Increased stack size from 4096 to prevent overflow
      NULL,
      1,
      &commandTaskHandle,
      1  // Core 1 = zelfde als loop, voorkomt Invalid mbox bij HTTP
    );
    logger.info("Command task created (Modbus enabled)");
  } else {
    logger.info("Command task not created (Modbus disabled)");
  }
  
  // Set serial number for API client (moet overeenkomen met ColdMonitor-setup/database)
  apiClient.setSerialNumber(getEffectiveDeviceSerial());
  
  logger.info("All tasks started");
  logger.info("=== System Ready ===");
}

void loop() {
  // Check two-step reset sequence
  if (resetButton.checkTwoStepReset()) {
    logger.warn("RESET: Factory reset getriggerd vanuit loop!");
    provisioning.factoryReset();
    wifiManager.resetSettings();
    WiFi.disconnect(true, true);
    WiFi.mode(WIFI_OFF);
    delay(500);
    delay(2000);
    ESP.restart();
    return;
  }
  
  // Main loop handles system-level tasks (alle HTTP hier: zelfde core als WiFi → voorkomt Invalid mbox)
  static unsigned long lastHeartbeat = 0;
  static unsigned long lastApiHeartbeat = 0;
  static unsigned long apiRetryBackoff = 10000;  // 10s heartbeat interval (3x = 30s offline threshold)
  static unsigned long lastBatteryCheck = 0;
  static unsigned long lastSettingsFetch = 0;
  static unsigned long lastUpload = 0;
  static float deviceMinTemp = -25.0f;
  static float deviceMaxTemp = -15.0f;
  static int deviceDoorAlarmDelaySec = 300;
  
  unsigned long now = millis();
  
  // Heartbeat LED
  if (now - lastHeartbeat > 1000) {
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    lastHeartbeat = now;
  }
  
  // Periodieke API heartbeat (exponentiële backoff bij failure)
  if (WiFi.isConnected() && provisioning.hasAPICredentials()) {
    if (lastApiHeartbeat == 0 || (now - lastApiHeartbeat >= apiRetryBackoff)) {
      bool apiOk = apiClient.apiHandshakeOrHeartbeat(true, WiFi.RSSI(), WiFi.localIP().toString());
      deviceStatus.connectedToWifi = true;
      deviceStatus.connectedToApi = apiOk;
      deviceStatus.lastError = apiOk ? "" : "API heartbeat failed";
      deviceStatus.lastHeartbeat = now;
      deviceStatus.uptimeMs = now;
      lastApiHeartbeat = now;
      if (apiOk) {
        apiRetryBackoff = 10000;  // 10s heartbeat interval
      } else {
        apiRetryBackoff = (apiRetryBackoff < 600000) ? apiRetryBackoff * 2 : 600000;  // Max 10 min
      }
    }
    // Settings sync elke 60s (min/max temp, deur-alarm vertraging)
    if (deviceStatus.connectedToApi && (lastSettingsFetch == 0 || (now - lastSettingsFetch >= 60000))) {
      float mt, Mx;
      int dd;
      if (apiClient.fetchDeviceSettings(mt, Mx, dd)) {
        deviceMinTemp = mt;
        deviceMaxTemp = Mx;
        deviceDoorAlarmDelaySec = dd;
        lastSettingsFetch = now;
      }
    }
  } else {
    deviceStatus.connectedToWifi = WiFi.isConnected();
    deviceStatus.connectedToApi = false;
  }
  
  // Battery check
  if (now - lastBatteryCheck > 60000) { // Every minute
    batteryMonitor.update();
    float voltage = batteryMonitor.getVoltage();
    int percentage = batteryMonitor.getPercentage();
    
    if (voltage < 1.0f) {
      logger.info("Batterij-meetpin: " + String(voltage, 2) + "V (geen batterij aangesloten; voeding via USB/PSU is OK)");
    } else {
      logger.info("Battery: " + String(voltage, 2) + "V (" + String(percentage) + "%)");
    }
    
    // Geen deep sleep bij (vrijwel) geen spanning = USB-voeding, geen batterij aangesloten
    // Drempel 1.0V: ADC-ruis zonder batterij kan ~0.5V zijn, echte lege batterij is ~3.0V
    if (voltage < 1.0f) {
      // USB / geen batterij: nooit deep sleep vanwege "batterij leeg"
    } else {
      if (percentage < 20) {
        logger.warn("Low battery warning!");
      }
      if (percentage < 10) {
        logger.error("Critical battery! Entering deep sleep...");
        powerManager.enterDeepSleep(3600);
      }
    }
    
    lastBatteryCheck = now;
  }
  
  // Uploads (alle HTTP in loop = zelfde core als WiFi, voorkomt Invalid mbox crash)
  if (WiFi.isConnected() && provisioning.hasAPICredentials()) {
    // Flush door events first (FIFO, immediate + offline queue)
    static DoorEvent retryDoorEvent;
    static bool hasRetry = false;
    if (hasRetry) {
      const char* state = retryDoorEvent.isOpen ? "OPEN" : "CLOSED";
      if (apiClient.uploadDoorEvent(state, retryDoorEvent.seq, retryDoorEvent.timestamp, retryDoorEvent.rssi, retryDoorEvent.uptimeMs)) {
        hasRetry = false;
        logger.info("Deur-event retry OK: " + String(state));
      }
    }
    while (!hasRetry && doorEventManager.hasPending()) {
      DoorEvent ev;
      doorEventManager.dequeue(ev);
      const char* state = ev.isOpen ? "OPEN" : "CLOSED";
      if (apiClient.uploadDoorEvent(state, ev.seq, ev.timestamp, ev.rssi, ev.uptimeMs)) {
        logger.info("Deur-event verstuurd: " + String(state) + " (seq=" + String(ev.seq) + ")");
      } else {
        retryDoorEvent = ev;
        hasRetry = true;
        logger.warn("Deur-event upload mislukt, retry later");
        break;
      }
    }
    int count = dataBuffer.getCount();
    unsigned long uploadInterval = config.getUploadInterval() * 1000;
    bool shouldUpload = (lastUpload == 0 && count > 0) || (lastUpload != 0 && (now - lastUpload >= uploadInterval));
    if (shouldUpload && count > 0) {
      logger.info("Uploading " + String(count) + " readings...");
      int uploaded = 0;
      for (int i = 0; i < count; i++) {
        String data = dataBuffer.get(i);
        if (apiClient.uploadReading(data)) {
          uploaded++;
          logger.debug("Uploaded: " + data);
        } else {
          logger.warn("Upload failed for: " + data);
          break;
        }
        delay(100);
      }
      if (uploaded > 0) {
        dataBuffer.remove(uploaded);
        logger.info("Successfully uploaded " + String(uploaded) + " readings");
      }
      lastUpload = now;
    }
  }
  
  // Uitgestelde OTA-init als eerste poging mislukte (WiFi nog niet klaar)
  static unsigned long lastOTADeferredAttempt = 0;
  if (WiFi.isConnected() && (now - lastOTADeferredAttempt >= 30000)) {
    lastOTADeferredAttempt = now;
    otaUpdate.tryDeferredInit();
  }
  // Check for OTA updates
  otaUpdate.handle();
  
  // Check if we should enter deep sleep (power saving mode)
  if (config.getDeepSleepEnabled() && !WiFi.isConnected()) {
    deepSleepIfNeeded();
  }
  
  delay(100);
}

void sensorTask(void *parameter) {
  logger.info("Sensor task started");
  
  unsigned long lastReading = 0;
  unsigned long lastDoorCheck = 0;
  unsigned long interval = config.getReadingInterval() * 1000; // ms
  static float lastKnownTemp = 0.0f;
  static float lastKnownHumidity = 0.0f;
  static bool hasValidReading = false;
  
  while (true) {
    unsigned long now = millis();
    
    // Deur elke 50ms checken met debounce; bij state change event in queue
    if (now - lastDoorCheck >= 50) {
      bool doorOpen = sensors.readDoorOnly();
      if (doorEventManager.poll(doorOpen) && hasValidReading) {
        DoorEvent ev;
        ev.isOpen = doorOpen;
        ev.timestamp = now;
        ev.seq = doorEventManager.getNextSeq();
        ev.rssi = WiFi.isConnected() ? WiFi.RSSI() : 0;
        ev.uptimeMs = now;
        doorEventManager.enqueue(ev);
        logger.info("Deur " + String(doorOpen ? "OPEN" : "DICHT") + " (seq=" + String(ev.seq) + ") – event in queue");
      }
      lastDoorCheck = now;
    }
    
    // Volledige sensorread op interval (temp, humidity, deur)
    if (now - lastReading >= interval) {
      SensorData data = sensors.read();
      
      // Fallback naar MAX31865 als nieuwe sensoren falen
      if (!data.valid && tempSensor.isValid()) {
        data.temperature = tempSensor.readTemperature();
        data.valid = true;
      }
      
      if (data.valid) {
        lastKnownTemp = data.temperature;
        lastKnownHumidity = data.humidity;
        hasValidReading = true;
        
        // Altijd op monitor tonen (INFO); pin=0/1 om deurcontact te debuggen
        logger.info("Data | Temp: " + String(data.temperature, 2) + "°C | Hum: " +
                    String(data.humidity, 1) + "% | Deur: " + (data.doorOpen ? "OPEN" : "dicht") +
                    " (pin=" + String(data.doorPinHigh ? 1 : 0) + ")");

        DynamicJsonDocument doc(512);
        doc["deviceId"] = getEffectiveDeviceSerial();
        doc["temperature"] = round(data.temperature * 10) / 10.0;  // 1 decimaal
        doc["humidity"] = round(data.humidity * 10) / 10.0;
        doc["doorStatus"] = data.doorOpen;
        doc["powerStatus"] = true;  // Stroom OK (geen detectie nu)
        doc["batteryLevel"] = batteryMonitor.getPercentage();
        doc["batteryVoltage"] = batteryMonitor.getVoltage();
        doc["timestamp"] = now;
        if (data.pressure > 0) doc["pressure"] = round(data.pressure * 10) / 10.0;
        
        String jsonData;
        serializeJson(doc, jsonData);
        dataBuffer.add(jsonData);
        
        logger.debug("Reading buffered");
      } else {
        logger.warn("No valid sensor reading!");
      }
      
      lastReading = now;
    }
    
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void modbusTask(void *parameter) {
  logger.info("Modbus task started");
  
  ModbusData modbusData;
  unsigned long lastRead = 0;
  unsigned long interval = config.getModbusInterval() * 1000;
  
  while (true) {
    unsigned long now = millis();
    
    if (now - lastRead >= interval && config.getModbusEnabled()) {
      // Read from Modbus device
      if (modbus.readHoldingRegisters(0, 10)) {
        modbusData.setpoint = modbus.getFloat(0);
        modbusData.currentTemp = modbus.getFloat(2);
        modbusData.compressorStatus = modbus.getBool(4);
        modbusData.alarmStatus = modbus.getBool(5);
        modbusData.timestamp = now;
        modbusData.valid = true;
        
        logger.debug("Modbus data read: Setpoint=" + String(modbusData.setpoint) + 
                    ", Temp=" + String(modbusData.currentTemp));
        
        // Optionally write setpoint
        if (config.getModbusWriteEnabled()) {
          // modbus.writeHoldingRegister(0, newSetpoint);
        }
      } else {
        logger.warn("Modbus read failed!");
        modbusData.valid = false;
      }
      
      lastRead = now;
    }
    
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

void uploadTask(void *parameter) {
  logger.info("Upload task started (WiFi monitor only – HTTP in loop)");
  unsigned long lastReconnectAttempt = 0;
  const unsigned long reconnectInterval = 60000;
  
  while (true) {
    unsigned long now = millis();
    bool currentlyConnected = (WiFi.status() == WL_CONNECTED);
    
    if (currentlyConnected && !lastWiFiConnected) {
      String currentSSID = WiFi.SSID();
      logger.info("========================================");
      logger.info("WiFi TERUG ONLINE");
      logger.info("SSID: " + currentSSID);
      logger.info("IP: " + WiFi.localIP().toString());
      logger.info("RSSI: " + String(WiFi.RSSI()) + " dBm");
      logger.info("========================================");
      if (lastWiFiSSID.length() > 0 && lastWiFiSSID != currentSSID) {
        logger.info(">>> NETWERK VERANDERD: " + currentSSID + " (was: " + lastWiFiSSID + ") <<<");
      }
      lastWiFiSSID = currentSSID;
      lastWiFiConnected = true;
    } else if (!currentlyConnected && lastWiFiConnected) {
      logger.warn("========================================");
      logger.warn("WiFi OFFLINE - verbinding verloren");
      logger.warn("Laatste SSID: " + lastWiFiSSID);
      logger.warn("========================================");
      lastWiFiConnected = false;
    } else if (currentlyConnected && lastWiFiSSID != WiFi.SSID()) {
      String newSSID = WiFi.SSID();
      logger.info(">>> NETWERK VERANDERD: " + newSSID + " (was: " + lastWiFiSSID + ") <<<");
      lastWiFiSSID = newSSID;
    }
    
    if (!currentlyConnected) {
      bool isProvisioned = provisioning.isProvisioned();
      if (isProvisioned && (lastReconnectAttempt == 0 || (now - lastReconnectAttempt >= reconnectInterval))) {
        logger.warn("WiFi offline - poging tot opnieuw verbinden...");
        WiFi.reconnect();
        lastReconnectAttempt = now;
      }
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

void commandTask(void *parameter) {
  logger.info("Command task started");
  
  unsigned long lastCheck = 0;
  const unsigned long checkInterval = 30000; // Check every 30 seconds (was 10, te frequent - voorkomt herhaalde uitvoering)
  unsigned long lastWatchdogFeed = 0;
  String lastExecutedCommandId = ""; // Track last executed command to prevent duplicates
  unsigned long lastCommandTime = 0;
  const unsigned long commandCooldown = 60000; // Don't execute same command again within 60 seconds
  
  while (true) {
    unsigned long now = millis();
    
    // Feed watchdog every 2 seconds to prevent resets
    if (now - lastWatchdogFeed >= 2000) {
      // ESP32 doesn't have explicit watchdog feed, but vTaskDelay helps
      lastWatchdogFeed = now;
    }
    
    // Only check if WiFi is connected and Modbus is enabled
    if (WiFi.isConnected() && config.getModbusEnabled() && config.getModbusWriteEnabled()) {
      if (now - lastCheck >= checkInterval) {
        lastCheck = now;
        
        // Check for pending commands with error handling
        String commandType, commandId;
        DynamicJsonDocument parametersDoc(256);
        
        // Check if we have enough free heap memory before making HTTP call
        if (ESP.getFreeHeap() < 10000) {
          logger.warn("Low memory, skipping command check. Free heap: " + String(ESP.getFreeHeap()));
        } else {
          bool hasCommand = apiClient.getPendingCommand(commandType, commandId, parametersDoc);
          
          // Prevent duplicate execution: check if this is the same command we just executed
          bool isDuplicate = (commandId == lastExecutedCommandId && (now - lastCommandTime) < commandCooldown);
          
          if (hasCommand && commandType.length() > 0 && commandId.length() > 0 && !isDuplicate) {
            logger.info("Received NEW command: " + commandType + " (ID: " + commandId + ")");
            
            // Track this command
            lastExecutedCommandId = commandId;
            lastCommandTime = now;
            
            bool success = false;
            DynamicJsonDocument result(512); // Increased size
            
            if (commandType == "DEFROST_START") {
              // Start defrost via RS485
              // Carel PZD2S0P001: Usually register 0x0006 or coil 0x0006 for defrost command
              // Value 1 = start defrost, 0 = stop
              logger.info("Executing DEFROST_START command...");
              if (modbus.writeSingleRegister(0x0006, 1)) {
                logger.info("Defrost command sent via RS485 - SUCCESS");
                success = true;
                result["status"] = "defrost_started";
                // Small delay after RS485 write
                delay(100);
              } else {
                logger.error("Failed to send defrost command via RS485");
                result["error"] = "RS485 write failed";
              }
            } else if (commandType == "READ_TEMPERATURE") {
              // Read temperature via RS485
              logger.info("Executing READ_TEMPERATURE command...");
              if (modbus.readInputRegisters(0x0000, 2)) {
                float temp = modbus.getFloat(0);
                logger.info("RS485 temperature read: " + String(temp) + " °C");
                success = true;
                result["temperature"] = temp;
              } else {
                logger.error("Failed to read temperature via RS485");
                result["error"] = "RS485 read failed";
              }
            } else {
              logger.warn("Unknown command type: " + commandType);
              result["error"] = "Unknown command type";
            }
            
            // Report command completion (only if we have enough memory)
            if (ESP.getFreeHeap() > 5000) {
              DynamicJsonDocument resultDoc(512);
              if (result.containsKey("status")) {
                resultDoc["status"] = result["status"].as<String>();
              }
              if (result.containsKey("temperature")) {
                resultDoc["temperature"] = result["temperature"].as<float>();
              }
              if (result.containsKey("error")) {
                resultDoc["error"] = result["error"].as<String>();
              }
              
              bool reported = apiClient.completeCommand(commandId, success, resultDoc);
              if (reported) {
                logger.info("Command completion reported to backend");
              } else {
                logger.error("Failed to report command completion");
              }
            } else {
              logger.error("Not enough memory to report command completion");
            }
          } else if (isDuplicate) {
            logger.debug("Skipping duplicate command: " + commandId + " (executed " + String((now - lastCommandTime) / 1000) + "s ago)");
          }
        }
      }
    } else {
      // If conditions not met, reset lastCheck to avoid immediate check when conditions become true
      if (!WiFi.isConnected()) {
        lastCheck = 0; // Reset when WiFi reconnects
      }
    }
    
    // Check two-step reset sequence periodically
    if (resetButton.checkTwoStepReset()) {
      logger.warn("RESET: Factory reset getriggerd vanuit upload task!");
      provisioning.factoryReset();
      wifiManager.resetSettings();
      WiFi.disconnect(true, true);
      WiFi.mode(WIFI_OFF);
      delay(500);
      delay(2000);
      ESP.restart();
      return;
    }
    
    // Always delay to prevent tight loop and feed watchdog
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}


static void onWifiParamsSaved(const char* apiUrl, const char* apiKey, const char* deviceSerial) {
  logger.info("========================================");
  logger.info("PORTAL: Instellingen opgeslagen");
  logger.info("========================================");
  
  // API URL is vast (FIXED_API_URL), altijd geldig
  if (!apiKey || strlen(apiKey) == 0) {
    logger.error("ERROR: API Key is empty or null!");
    return;
  }
  
  // Debug: log received serial (eerste 4 chars voor verificatie)
  String serialStr = deviceSerial ? String(deviceSerial) : "";
  if (serialStr.length() > 0) {
    logger.info("PORTAL: Serienummer ontvangen: " + serialStr.substring(0, serialStr.length() > 4 ? 4 : serialStr.length()) + (serialStr.length() > 4 ? "****" : ""));
  } else {
    logger.warn("PORTAL: Serienummer LEEG - vul het veld in of scan de QR-code uit de app!");
  }
  
  // Get WiFi credentials from WiFiManager (they're saved internally)
  String ssid = WiFi.SSID();
  String pass = ""; // WiFiManager saves password internally, we can't retrieve it
  
  // Note: WiFi password is saved by WiFiManager in its own NVS namespace
  // We'll mark WiFi as provisioned by checking if SSID exists
  
  bool success = true;
  
  // Save API credentials + serienummer naar provisioning manager
  success &= provisioning.setAPICredentials(String(apiUrl), String(apiKey));
  String serialTrimmed = deviceSerial ? String(deviceSerial) : "";
  serialTrimmed.trim();
  if (serialTrimmed.length() > 0) {
    success &= provisioning.setDeviceSerial(serialTrimmed);
  } else {
    logger.warn("PORTAL: Serienummer niet opgeslagen (leeg) - uploads gebruiken mogelijk default!");
  }
  
  // Save WiFi SSID (password is handled by WiFiManager)
  if (ssid.length() > 0) {
    // We can't get the password from WiFiManager, but it's saved internally
    // So we'll just save the SSID and mark WiFi as provisioned
    // The actual password is in WiFiManager's NVS namespace
    provisioning.setWiFiCredentials(ssid, "saved_by_wifimanager"); // Placeholder
  }
  
  // Also save to config manager for backward compatibility
  config.setAPIUrl(String(apiUrl));
  config.setAPIKey(String(apiKey));
  if (serialTrimmed.length() > 0) {
    config.setDeviceSerial(serialTrimmed);
  }
  config.save();
  
  if (success) {
    // Mark as provisioned
    provisioning.setProvisioned(true);
    provisioning.save();
    
    logger.info("PROVISIONING: Instellingen opgeslagen in NVS");
    logger.info("PROVISIONING: Device is nu PROVISIONED");
    logger.info("PROVISIONING: Herstarten over 2 seconden...");
    
    // Set API client for immediate use
    apiClient.setAPIUrl(String(apiUrl));
    apiClient.setAPIKey(String(apiKey));
    if (serialTrimmed.length() > 0) {
      apiClient.setSerialNumber(serialTrimmed);
    }
    
    delay(2000);
    ESP.restart();
  } else {
    logger.error("PROVISIONING: FOUT bij opslaan instellingen!");
  }
  
  logger.info("========================================");
}

void setupWiFi() {
  logger.info("========================================");
  logger.info("WIFI: Setup starten...");
  logger.info("========================================");
  
  wifiManager.setConfigPortalTimeout(180);   // 3 minuten voor config portal
  wifiManager.setConnectTimeout(20);        // 20 seconden timeout voor WiFi connect
  
  // Check provisioning state
  bool isProvisioned = provisioning.isProvisioned();
  bool hasWiFi = provisioning.hasWiFiCredentials();
  bool hasAPI = provisioning.hasAPICredentials();
  
  // Determine if we need config portal
  // ALWAYS start portal if provisioning is not complete
  bool needsConfigPortal = (!isProvisioned || !hasWiFi || !hasAPI);
  
  if (needsConfigPortal) {
    logger.warn("========================================");
    logger.warn("BOOT: Eerste start: geen configuratie -> start ColdMonitor-Setup");
    if (!hasAPI) logger.warn("BOOT: API config ontbreekt (api_url/api_key)");
    logger.warn("  Provisioned: " + String(isProvisioned ? "JA" : "NEE"));
    logger.warn("  WiFi credentials: " + String(hasWiFi ? "JA" : "NEE"));
    logger.warn("  API credentials: " + String(hasAPI ? "JA" : "NEE"));
    logger.warn("PORTAL: Config portal wordt gestart...");
    logger.warn("========================================");
    
    // CRITICAL: Wis OUDE WiFi credentials eerst - anders blijven aanhangsels hangen
    logger.info("PORTAL: Schoonmaken: oude WiFi credentials wissen...");
    provisioning.wipeWiFiCredentials();
    delay(500);
    
    logger.info("PORTAL: Wissen oude WiFiManager credentials...");
    wifiManager.resetSettings();
    delay(1500);  // Laat WiFi stack volledig stabiliseren na reset
    
    // Start config portal
    logger.info("PORTAL: Config portal starten (provisioning niet compleet)...");
    
    // Get current values (if any)
    String apiUrl = provisioning.hasAPICredentials() ? provisioning.getAPIUrl() : "";
    String apiKey = provisioning.hasAPICredentials() ? provisioning.getAPIKey() : "";
    String deviceSerial = getEffectiveDeviceSerial();
    
    // Setup WiFiManager parameters
    wifiManager.setupColdMonitorParams(
      apiUrl.c_str(),
      apiKey.c_str(),
      deviceSerial.c_str()
    );
    wifiManager.setOnSaveParamsCallback(onWifiParamsSaved);
    
    // Start config portal (it will handle WiFi mode internally)
    logger.info("PORTAL: Starten config portal...");
    
    bool portalStarted = wifiManager.startConfigPortal("ColdMonitor-Setup");
    
    if (portalStarted) {
      logger.info("PORTAL: Config portal actief");
      logger.info("PORTAL: Wacht op configuratie...");
      // Portal will block until configured or timeout
      // After configuration, callback will be called and device will restart
    } else {
      logger.error("PORTAL: Config portal start mislukt!");
      logger.error("PORTAL: Probeer opnieuw of gebruik factory reset");
    }
    
    return; // Exit - portal is running
  } else {
    // Try to connect with saved credentials
    String ssid = provisioning.getWiFiSSID();
    String pass = provisioning.getWiFiPassword();
    bool passwordFromWiFiManager = (pass.length() == 0 || pass == "saved_by_wifimanager");
    
    logger.info("WIFI: Opgeslagen credentials gevonden");
    logger.info("WIFI: Verbinden met SSID: " + ssid);
    if (passwordFromWiFiManager) {
      logger.info("WIFI: Wachtwoord beheerd door WiFiManager (niet wissen!)");
    }
    
    // NIET WiFi.disconnect(true,true) als WiFiManager het wachtwoord heeft opgeslagen!
    // Dat wist de credentials die WiFiManager in de ESP32 WiFi-stack heeft gezet.
    if (!passwordFromWiFiManager) {
      logger.info("WIFI: Wissen oude WiFi stack credentials...");
      WiFi.disconnect(true, true);
      delay(500);
    } else {
      WiFi.disconnect();  // Alleen disconnect, credentials NIET wissen
      delay(200);
    }
    
    if (ssid.length() == 0) {
      logger.warn("WIFI: Geen SSID opgeslagen - start config portal");
      needsConfigPortal = true;
    } else {
      // Setup WiFiManager with saved values
      String apiUrl = provisioning.getAPIUrl();
      String apiKey = provisioning.getAPIKey();
      String deviceSerial = getEffectiveDeviceSerial();
      
      wifiManager.setupColdMonitorParams(
        apiUrl.c_str(),
        apiKey.c_str(),
        deviceSerial.c_str()
      );
      wifiManager.setOnSaveParamsCallback(onWifiParamsSaved);
      
      // Try auto-connect
      logger.info("WIFI: Auto-connect starten (timeout: 20s)...");
      bool connected = wifiManager.autoConnect("ColdMonitor-Setup");
    
    if (!connected) {
      logger.warn("WIFI: Auto-connect mislukt - start config portal");
      // Clear failed credentials to prevent retry
      WiFi.disconnect(true, true);
      delay(200);
      needsConfigPortal = true;
    } else {
      // Connected successfully
      String currentSSID = WiFi.SSID();
      String currentIP = WiFi.localIP().toString();
      
      logger.info("========================================");
      logger.info("WIFI: NETWERK ONLINE");
      logger.info("  SSID: " + currentSSID);
      logger.info("  IP: " + currentIP);
      logger.info("  RSSI: " + String(WiFi.RSSI()) + " dBm");
      logger.info("  Gebruikt opgeslagen API-instellingen");
      logger.info("========================================");
      
      lastWiFiSSID = currentSSID;
      lastWiFiConnected = true;
      WiFi.setAutoReconnect(true);
      
      // Reload API config from provisioning
      apiUrl = provisioning.getAPIUrl();
      apiKey = provisioning.getAPIKey();
      apiClient.setAPIUrl(apiUrl);
      apiClient.setAPIKey(apiKey);
      apiClient.setSerialNumber(getEffectiveDeviceSerial());
      
      logger.info("API: Configuratie geladen vanuit provisioning");
      
      // API handshake: meld device als ONLINE
      bool apiOk = apiClient.apiHandshakeOrHeartbeat(true, WiFi.RSSI(), WiFi.localIP().toString());
      deviceStatus.connectedToWifi = true;
      deviceStatus.connectedToApi = apiOk;
      deviceStatus.lastError = apiOk ? "" : "API handshake failed";
      deviceStatus.lastHeartbeat = millis();
      deviceStatus.uptimeMs = millis();
      
      if (apiOk) {
        logger.info("API: ONLINE - heartbeat succesvol");
      } else {
        logger.warn("API: WIFI_OK_API_FAIL - retry op interval");
      }
      
      String statusJson = apiClient.publishStatusJson(true, apiOk, apiOk ? "" : "API handshake failed");
      logger.info("STATUS: " + statusJson);
      
      return; // Success - exit
    }
    } // End of else block for credentials check
  }
  
  // Als credentials ontbreken of autoConnect mislukte: start config portal
  if (needsConfigPortal) {
    logger.warn("WIFI: Config portal starten (credentials ontbreken of connect mislukt)...");
    provisioning.wipeWiFiCredentials();
    delay(500);
    wifiManager.resetSettings();
    delay(500);
    
    String apiUrl = provisioning.getAPIUrl();
    String apiKey = provisioning.getAPIKey();
    String deviceSerial = getEffectiveDeviceSerial();
    wifiManager.setupColdMonitorParams(apiUrl.c_str(), apiKey.c_str(), deviceSerial.c_str());
    wifiManager.setOnSaveParamsCallback(onWifiParamsSaved);
    
    if (wifiManager.startConfigPortal("ColdMonitor-Setup")) {
      logger.info("PORTAL: Config portal actief - wacht op configuratie");
    } else {
      logger.error("PORTAL: Config portal start mislukt");
    }
  }
}

void setupOTA() {
  otaUpdate.init(config.getOTAPassword());
  logger.info("OTA update initialized");
}

void deepSleepIfNeeded() {
  // Enter deep sleep if configured and no WiFi
  if (config.getDeepSleepEnabled() && WiFi.status() != WL_CONNECTED) {
    unsigned long sleepDuration = config.getDeepSleepDuration();
    logger.info("Entering deep sleep for " + String(sleepDuration) + " seconds");
    powerManager.enterDeepSleep(sleepDuration);
  }
}
