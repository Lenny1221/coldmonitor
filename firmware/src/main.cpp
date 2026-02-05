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
#include "sensors.h"
#include "max31865_driver.h"
#include "rs485_modbus.h"
#include "data_buffer.h"
#include "wifi_manager.h"
#include "api_client.h"
#include "battery_monitor.h"
#include "ota_update.h"
#include "power_manager.h"

// Global objects
ConfigManager config;
Logger logger;
Sensors sensors;
MAX31865Driver tempSensor;
RS485Modbus modbus;
DataBuffer dataBuffer;
WiFiManagerWrapper wifiManager;
APIClient apiClient;
BatteryMonitor batteryMonitor;
OTAUpdate otaUpdate;
PowerManager powerManager;

// Task handles
TaskHandle_t sensorTaskHandle = NULL;
TaskHandle_t modbusTaskHandle = NULL;
TaskHandle_t uploadTaskHandle = NULL;

// WiFi status tracking
String lastWiFiSSID = "";
bool lastWiFiConnected = false;

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

// Function prototypes
void sensorTask(void *parameter);
void modbusTask(void *parameter);
void uploadTask(void *parameter);
void setupWiFi();
void setupOTA();
void deepSleepIfNeeded();

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);  // Brownout detector uit (voorkomt reset bij WiFi/AP stroompiek)
  
  Serial.begin(115200);
  delay(1000);
  
  logger.info("=== ColdMonitor ESP32 Firmware Starting ===");
  logger.info("Version: " + String(FIRMWARE_VERSION));
  
  // Initialize LED (voor feedback bij WiFi-reset)
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);  // Start uit
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    logger.error("SPIFFS initialization failed!");
    return;
  }
  logger.info("SPIFFS initialized");
  
  // Load configuration
  if (!config.load()) {
    logger.warn("Failed to load config, using defaults");
    config.setDefaults();
    config.save();
  }
  logger.info("Configuration loaded");
  
  // Knop om WiFi te resetten: houd BOOT (GPIO0) 3 s ingedrukt vóór/ tijdens opstarten
  #define PIN_WIFI_RESET 0   // BOOT-knop op de meeste ESP32-devboards
  pinMode(PIN_WIFI_RESET, INPUT_PULLUP);
  delay(100);
  logger.info(">>> Houd BOOT-knop 3 s ingedrukt om WiFi te resetten (LED knippert tijdens indrukken) <<<");
  {
    const unsigned long holdMs = 3000;
    const unsigned long stepMs = 100;
    const unsigned long ledBlinkMs = 200;  // LED knippert elke 200ms
    unsigned long t = 0;
    unsigned long lastLedToggle = 0;
    bool ledState = false;
    
    while (t < holdMs && digitalRead(PIN_WIFI_RESET) == LOW) {
      // LED knipperen tijdens indrukken
      if (t - lastLedToggle >= ledBlinkMs) {
        ledState = !ledState;
        digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
        lastLedToggle = t;
      }
      
      if (t > 0 && t % 1000 < stepMs) {
        unsigned int secLeft = (holdMs - t) / 1000;
        logger.info("WiFi-reset: nog " + String(secLeft) + " s vasthouden... (LED knippert)");
      }
      delay(stepMs);
      t += stepMs;
    }
    
    // LED uit als knop losgelaten
    digitalWrite(LED_BUILTIN, LOW);
    
    if (t >= holdMs) {
      logger.info("========================================");
      logger.info("BOOT 3 s ingedrukt - WiFi-gegevens WISSEN");
      logger.info("========================================");
      wifiManager.resetSettings();
      logger.info("WiFi gewist. Herstart over 2 seconden.");
      logger.info(">>> Na herstart: config-portal ColdMonitor-Setup opent <<<");
      // LED snel knipperen als bevestiging
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
        delay(100);
      }
      delay(1000);
      ESP.restart();
    }
  }
  
  // WiFi EERST – AP "ColdMonitor-Setup" verschijnt direct (sensors kunnen I²C blokkeren)
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
  
  // Setup OTA
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
  
  logger.info("All tasks started");
  logger.info("=== System Ready ===");
}

void loop() {
  // Main loop handles system-level tasks
  static unsigned long lastHeartbeat = 0;
  static unsigned long lastBatteryCheck = 0;
  
  unsigned long now = millis();
  
  // Heartbeat LED
  if (now - lastHeartbeat > 1000) {
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    lastHeartbeat = now;
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
  unsigned long interval = config.getReadingInterval() * 1000; // ms
  
  while (true) {
    unsigned long now = millis();
    
    if (now - lastReading >= interval) {
      SensorData data = sensors.read();
      
      // Fallback naar MAX31865 als nieuwe sensoren falen
      if (!data.valid && tempSensor.isValid()) {
        data.temperature = tempSensor.readTemperature();
        data.valid = true;
      }
      
      if (data.valid) {
        // Altijd op monitor tonen (INFO); pin=0/1 om deurcontact te debuggen
        logger.info("Data | Temp: " + String(data.temperature, 2) + "°C | Hum: " +
                    String(data.humidity, 1) + "% | Deur: " + (data.doorOpen ? "OPEN" : "dicht") +
                    " (pin=" + String(data.doorPinHigh ? 1 : 0) + ")");

        DynamicJsonDocument doc(512);
        doc["deviceId"] = config.getDeviceSerial();
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
    
    vTaskDelay(pdMS_TO_TICKS(100));
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
  logger.info("Upload task started");
  
  unsigned long lastUpload = 0;
  unsigned long lastReconnectAttempt = 0;
  const unsigned long reconnectInterval = 60000;  // Elke 60 s reconnect proberen bij offline
  unsigned long interval = config.getUploadInterval() * 1000;
  
  while (true) {
    unsigned long now = millis();
    
    // Check WiFi status en log wijzigingen
    bool currentlyConnected = (WiFi.status() == WL_CONNECTED);
    
    if (currentlyConnected && !lastWiFiConnected) {
      // WiFi terug online
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
      // WiFi offline gegaan
      logger.warn("========================================");
      logger.warn("WiFi OFFLINE - verbinding verloren");
      logger.warn("Laatste SSID: " + lastWiFiSSID);
      logger.warn("========================================");
      lastWiFiConnected = false;
    } else if (currentlyConnected && lastWiFiSSID != WiFi.SSID()) {
      // Netwerk veranderd terwijl verbonden
      String newSSID = WiFi.SSID();
      logger.info(">>> NETWERK VERANDERD: " + newSSID + " (was: " + lastWiFiSSID + ") <<<");
      lastWiFiSSID = newSSID;
    }
    
    // Check if WiFi is connected
    if (currentlyConnected) {
      int count = dataBuffer.getCount();
      // Eerste upload direct zodra er data is (lastUpload==0); daarna volgens interval
      bool shouldUpload = (lastUpload == 0 && count > 0) || (lastUpload != 0 && (now - lastUpload >= interval));

      if (shouldUpload) {
        if (count > 0) {
          logger.info("Uploading " + String(count) + " readings...");

          int uploaded = 0;
          for (int i = 0; i < count; i++) {
            String data = dataBuffer.get(i);

            if (apiClient.uploadReading(data)) {
              uploaded++;
              logger.debug("Uploaded: " + data);
            } else {
              logger.warn("Upload failed for: " + data);
              break; // Stop on first failure
            }

            delay(100); // Small delay between uploads
          }

          if (uploaded > 0) {
            dataBuffer.remove(uploaded);
            logger.info("Successfully uploaded " + String(uploaded) + " readings");
          }
        }
        lastUpload = now;
      }
    } else {
      // WiFi offline: periodiek opnieuw verbinden proberen
      if (lastReconnectAttempt == 0 || (now - lastReconnectAttempt >= reconnectInterval)) {
        logger.warn("WiFi offline - poging tot opnieuw verbinden...");
        WiFi.reconnect();
        lastReconnectAttempt = now;
      }
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

static void onWifiParamsSaved(const char* apiUrl, const char* apiKey, const char* deviceSerial) {
  config.setAPIUrl(apiUrl);
  config.setAPIKey(apiKey);
  config.setDeviceSerial(deviceSerial);
  config.save();
  apiClient.setAPIUrl(apiUrl);
  apiClient.setAPIKey(apiKey);
  logger.info("API URL, key en serienummer opgeslagen");
}

void setupWiFi() {
  wifiManager.setConfigPortalTimeout(180);   // 3 minuten voor config portal
  wifiManager.setConnectTimeout(30);         // Tot 30 s wachten op router (na stroomonderbreking)
  
  // API URL + API key + serienummer in config portal
  wifiManager.setupColdMonitorParams(
    config.getAPIUrl().c_str(),
    config.getAPIKey().c_str(),
    config.getDeviceSerial().c_str()
  );
  wifiManager.setOnSaveParamsCallback(onWifiParamsSaved);
  
  // Altijd eerst opgeslagen WiFi proberen (na USB uit/in of herstart). Alleen bij falen opent het portal.
  logger.info("Verbinden met opgeslagen WiFi...");
  bool connected = wifiManager.autoConnect("ColdMonitor-Setup");
  
  if (connected) {
    String currentSSID = WiFi.SSID();
    String currentIP = WiFi.localIP().toString();
    
    logger.info("========================================");
    logger.info("WiFi NETWERK ONLINE");
    logger.info("SSID: " + currentSSID);
    logger.info("IP: " + currentIP);
    logger.info("RSSI: " + String(WiFi.RSSI()) + " dBm");
    logger.info("========================================");
    
    // Detecteer nieuw netwerk
    if (lastWiFiSSID.length() > 0 && lastWiFiSSID != currentSSID) {
      logger.info(">>> NIEUW NETWERK GEDETECTEERD: " + currentSSID + " (was: " + lastWiFiSSID + ") <<<");
    }
    
    lastWiFiSSID = currentSSID;
    lastWiFiConnected = true;
    
    apiClient.setAPIUrl(config.getAPIUrl());
    apiClient.setAPIKey(config.getAPIKey());
    WiFi.setAutoReconnect(true);  // Bij verlies van WiFi automatisch opnieuw verbinden
  } else {
    logger.error("WiFi setup mislukt - geen verbinding");
    lastWiFiConnected = false;
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
