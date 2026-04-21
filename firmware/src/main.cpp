#include <Arduino.h>
#include <Wire.h>  // LDF: Wire-pad voor Adafruit BusIO (MAX31865); geen I²C-sensoren in firmware
#include <WiFi.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#include "board_pins.h"

/* Carrier v1.1 heeft geen gebruiker-LED (GPIO12 = VBUS_DETECT).
 * Laat LED_BUILTIN bestaan voor externe libs, maar alle driver-ops gaan via
 * BOARD_LED_SET/TOGGLE die no-ops zijn bij BOARD_HAS_STATUS_LED=0. */
#undef LED_BUILTIN
#define LED_BUILTIN BOARD_STATUS_LED_PIN
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "config.h"
#include "logger.h"
#include "provisioning.h"
#include "reset_button.h"
#include "sensors.h"
#include "sensors_pt1000.h"
#include "rs485_modbus.h"
#include "carel_protocol.h"
#include "data_buffer.h"
#include "wifi_manager.h"
#include "api_client.h"
#include "battery_monitor.h"
#include "power_monitor.h"
#include "door_events.h"
#include "door_contact.h"
#include "boot_state.h"
#include "time_utils.h"
#include "ota_update.h"
#include "power_manager.h"
#include "pins_carrier.h"
#include "watchdog_tpl5010.h"
#include "relay_control.h"
#include "vbus_external.h"

// Global objects
ConfigManager config;
Logger logger;
ProvisioningManager provisioning;
// Single-button reset: BOOT knop (GPIO 0) 3 seconden vasthouden = factory reset
// (RESET-knop op ESP32 DevKit is niet aan GPIO gekoppeld – alleen BOOT werkt)
ResetButtonHandler resetButton(DEFAULT_BOOT_PIN, DEFAULT_RESET_PIN, BOOT_WINDOW_MS, RESET_HOLD_TIME_MS);
Sensors sensors;
// MAX31865 (PT1000) wordt nu beheerd door sensors_pt1000.* op carrier-PCB:
// 2× sensor op gedeelde SPI, RREF = 4020 Ω, 2-wire, 50 Hz filter.
static bool max31865Initialized = false;  // true als minstens 1 sensor OK bij init
RS485Modbus modbus;
CarelProtocol carel;
DataBuffer dataBuffer;
WiFiManagerWrapper wifiManager;
APIClient apiClient;
BatteryMonitor batteryMonitor;
PowerMonitor powerMonitor;
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

// Defrost: Carel PZD2S0P001 – booleans vaak bij 2-5, register 6 soms. Zie README.
#define DEFROST_REG_ADDR  0x0006  // Holding register (F06)
#define DEFROST_COIL_ADDR 0x0002  // Coil (F05) – Carel booleans start bij 2

// Controller type from API (override config when set)
static String controllerTypeFromApi = "";
static int controllerSlaveAddrFromApi = 0;
static int controllerBaudRateFromApi = 0;

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

  // CARRIER v1.1: TPL5010 hardware-watchdog ALS EERSTE. De TPL5010 telt vanaf
  // power-on; als we pas na SPIFFS / factory-reset-venster kicken (~10 s),
  // heeft de watchdog de ESP32 al gereset en zit hij in een boot-loop.
  initWatchdog();

  Serial.begin(115200);
  delay(1000);
  kickWatchdog();

  // Boot banner
  logger.info("========================================");
  logger.info(String("=== ColdMonitor Firmware [") + COLDMONITOR_BOARD_NAME + "] ===");
  logger.info("Version: " + String(FIRMWARE_VERSION));
  logger.info("========================================");

  // Onboard status-LED: carrier v1.1 heeft er geen (GPIO12 = VBUS_DETECT).
  // BOARD_LED_*-macros zijn no-op wanneer BOARD_HAS_STATUS_LED=0.
  BOARD_LED_PINMODE(LED_BUILTIN);
  BOARD_LED_SET(LED_BUILTIN, BOARD_LED_LEVEL_ON);
  delay(100);
  BOARD_LED_SET(LED_BUILTIN, BOARD_LED_LEVEL_OFF);

  // Initialize SPIFFS (kan bij eerste boot >1 s duren door auto-format)
  kickWatchdog();
  if (!SPIFFS.begin(true)) {
    logger.error("SPIFFS initialization failed!");
    return;
  }
  kickWatchdog();
  logger.info("SPIFFS initialized");

  // Initialize Provisioning Manager (NVS open)
  if (!provisioning.begin()) {
    logger.error("CRITICAL: Provisioning manager initialization failed!");
    return;
  }
  kickWatchdog();

  // Log boot reason
  provisioning.logBootReason();

  // Check reset knop: BOOT (GPIO 0) 3 seconden vasthouden = factory reset
  logger.info("RESET: Houd BOOT knop 3 seconden vast voor factory reset");
  delay(300); // Stabilize button

  unsigned long resetCheckStart = millis();
  const unsigned long resetCheckTimeout = 8000;  // 8 seconden venster (3s vasthouden nodig)

  while (millis() - resetCheckStart < resetCheckTimeout) {
      kickWatchdog();  // Venster duurt langer dan TPL5010-periode → blijf kicken.
      if (resetButton.check()) {
        logger.warn("RESET: Factory reset getriggerd via BOOT knop!");

        // Complete factory reset - wipe everything
        logger.warn("RESET: Uitvoeren volledige factory reset...");
        provisioning.factoryReset();
        wifiManager.resetSettings();

        // Additional WiFi stack reset
        logger.warn("RESET: WiFi stack volledig resetten...");
        WiFi.disconnect(true, true); // disconnect and erase credentials
        WiFi.mode(WIFI_OFF);
        delay(500);
        kickWatchdog();

        logger.warn("RESET: Herstarten in 2 seconden...");
        delay(2000);
        ESP.restart();
        return;
      }
    delay(50); // Small delay to prevent tight loop
  }
  kickWatchdog();

  // Load configuration
  if (!config.load()) {
    logger.warn("Config: Geen opgeslagen configuratie gevonden, gebruik defaults");
    config.setDefaults();
  } else {
    logger.info("Config: Configuratie geladen uit NVS");
  }
  kickWatchdog();
  
  // Sync: als provisioning geen API credentials heeft maar config wel, overnemen (voorkomt portal)
  if (!provisioning.hasAPICredentials()) {
    String cfgUrl = config.getAPIUrl();
    String cfgKey = config.getAPIKey();
    if (cfgUrl.length() > 0 && cfgKey.length() > 0) {
      if (provisioning.setAPICredentials(cfgUrl, cfgKey)) {
        logger.info("PROVISIONING: API credentials overgenomen van config (coldmonitor)");
        if (provisioning.hasWiFiCredentials()) {
          provisioning.setProvisioned(true);
          provisioning.save();
        }
      }
    }
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
  
  // Offline queue vóór WiFi: na HTTP/LwIP is de heap sterk gefragmenteerd; databuffer-NVS
  // openen ná MAX31865 gaf TLSF heap-asserts op ESP32-S3.
  dataBuffer.init();
  logger.info("Data buffer initialized (offline queue)");
  
  // ADC/deur vóór WiFi: setupWiFi() gebruikt battery/power voor API-handshake
  sensors.init();
  logger.info("Sensors (door) initialized");
  batteryMonitor.init();
  powerMonitor.init();

  // --- Carrier-PCB v1.1 hardware layer (vóór connectivity) -----------------
  // initWatchdog() is al aangeroepen aan het begin van setup(); de FreeRTOS
  // kick-task loopt continu op core 0. Extra kick hier dekt enige piekdrukte
  // in setup().
  kickWatchdog();

#ifndef DIAG_SKIP_PT1000
  // PT1000 × 2 op gedeelde SPI; moet uit de heap zijn vóór WiFi-geheugen claimt.
  max31865Initialized = initSensors();
#else
  logger.warn("[DIAG] initSensors() SKIPPED (DIAG_SKIP_PT1000)");
  max31865Initialized = false;
#endif
  kickWatchdog();
  initRelay();
  initDoor();
  // RS485 (MAX3485): carrier-pinnen zijn GPIO 43/44/2 (niet meer de PSRAM-
  // pinnen van de vorige build), dus veilig om Serial1 nu al op te zetten.
  // DE wordt LOW gezet (ontvanger actief). Een latere Modbus-init mag
  // Serial1 opnieuw configureren.
  initRS485(9600);
  initExternalPowerSense();
  kickWatchdog();

  // WiFi Setup (with provisioning flow)
  setupWiFi();
  
  // TCP/IP even laten wegsterven na HTTP; vermindert heap-fragmentatie vóór SPI/taken
  delay(300);
  yield();
  
  // Initialize components
  logger.info("Initializing hardware...");
  
  // MAX31865 × 2 zijn al geïnitialiseerd hierboven via initSensors(). Status:
  if (max31865Initialized) {
    logger.info("PT1000 sensors beschikbaar (zie [SENSOR] log hierboven)");
  } else {
    logger.warn("Geen PT1000 OK – check bedrading (F+/F-) en Rref=4.02kΩ op carrier");
  }

  
  // Initialize RS485: Carel PJEZ (supervisie) OF Modbus RTU
  // LilyGO: NVS kan nog carelProtocolEnabled:true hebben; Serial2/Carel hoort niet op het
  // standaard board en droeg bij aan heap/crash — forceer uit op deze build.
#if defined(BOARD_LILYGO_T_SIM7670G_S3)
  const bool carelMode = false;
#else
  bool carelMode = config.getCarelProtocolEnabled();
#endif
  if (carelMode) {
    ModbusConfig mcfg = config.getModbusConfig();
    if (carel.init(mcfg.rxPin, mcfg.txPin, mcfg.dePin)) {
      logger.info("RS485/Carel PJEZ protocol initialized (1200 8N2)");
    } else {
      logger.error("Carel protocol init failed!");
    }
  } else if (config.getModbusEnabled()) {
    if (modbus.init(config.getModbusConfig())) {
      logger.info("RS485/Modbus initialized");
    } else {
      logger.error("RS485/Modbus initialization failed!");
    }
  }
  
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
  
  if (config.getModbusEnabled() && !carelMode) {
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
  
  // Command task for RS485 commands (Modbus of Carel PJEZ)
  if (config.getModbusEnabled() || carelMode) {
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
  // Carrier-PCB: hardware-watchdog eerst kicken en deur pollen (debounce + duur).
  kickWatchdog();
  updateDoor();

  // Check reset knop (BOOT 3s = factory reset)
  if (resetButton.check()) {
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
  
  // USB-detectie (indien USB_ADC geconfigureerd)
  powerMonitor.update();
  
  // WiFi auto-reconnect: detecteer verlies en probeer automatisch opnieuw
  static bool wifiWasConnected = false;
  static unsigned long wifiLostAt = 0;
  static unsigned long lastReconnectAttempt = 0;
  bool wifiNowConnected = WiFi.isConnected();

  if (wifiWasConnected && !wifiNowConnected && wifiLostAt == 0) {
    wifiLostAt = now;
    logger.warn("WiFi verbinding verloren! Automatisch reconnect over 5s...");
  }
  if (!wifiNowConnected && wifiLostAt > 0 && (now - lastReconnectAttempt >= 15000)) {
    lastReconnectAttempt = now;
    logger.info("WiFi reconnect poging (" + String((now - wifiLostAt) / 1000) + "s geleden verloren)...");
    WiFi.reconnect();
  }
  if (wifiNowConnected && wifiLostAt > 0) {
    logger.info("WiFi herverbonden na " + String((now - wifiLostAt) / 1000) + "s");
    wifiLostAt = 0;
    lastReconnectAttempt = 0;
  }
  wifiWasConnected = wifiNowConnected;

  // NTP sync bij WiFi‑connect (ook na reconnect – ntpInitDone reset bij verlies)
  static bool ntpInitDone = false;
  if (!wifiNowConnected) ntpInitDone = false;  // Reset bij verlies zodat NTP opnieuw synct
  if (wifiNowConnected && !ntpInitDone) {
    initNtpTime();
    ntpInitDone = true;
  }
  
  // Heartbeat: onboard LED (LilyGO: GPIO12)
  if (now - lastHeartbeat > 1000) {
    BOARD_LED_TOGGLE(LED_BUILTIN);
    lastHeartbeat = now;
  }
  
  // Eenmalige Carel connectietest ~8s na boot (niet op LilyGO: Carel wordt daar niet geïnitialiseerd;
  // oude NVS kan nog carelProtocolEnabled:true hebben.)
#if !defined(BOARD_LILYGO_T_SIM7670G_S3)
  static bool carelTestDone = false;
  if (!carelTestDone && now > 8000 && config.getCarelProtocolEnabled()) {
    carelTestDone = true;
    logger.info("=== CAREL CONNECTIETEST ===");
    float t = carel.readTemperature();
    if (!isnan(t)) {
      logger.info("Carel OK: temperatuur = " + String(t) + " °C");
    } else {
      logger.warn("Carel FOUT: geen antwoord. Check A/B bekabeling (probeer groen/wit omwisselen).");
    }
    int ty, iv, du;
    if (carel.readDefrostParams(ty, iv, du)) {
      logger.info("Carel OK: type=" + String(ty) + " interval=" + String(iv) + "h duur=" + String(du) + "min");
    } else {
      logger.warn("Carel FOUT: defrost params niet leesbaar.");
    }
    logger.info("=== EINDE CONNECTIETEST ===");
  }
#endif
  
  // Periodieke API heartbeat (exponentiële backoff bij failure)
  if (WiFi.isConnected() && provisioning.hasAPICredentials()) {
    if (lastApiHeartbeat == 0 || (now - lastApiHeartbeat >= apiRetryBackoff)) {
      int batPct = -1;
      bool onMains = false;
      if (batteryMonitor.getVoltage() >= 1.0f) batPct = batteryMonitor.getPercentage();
      if (powerMonitor.isUsbConnected()) onMains = true;
      bool apiOk = apiClient.apiHandshakeOrHeartbeat(true, WiFi.RSSI(), WiFi.localIP().toString(), batPct, onMains);
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
    // OTA check: once per boot, 30s after first successful heartbeat
    static bool otaChecked = false;
    if (deviceStatus.connectedToApi && !otaChecked && (now - lastApiHeartbeat >= 30000)) {
      otaChecked = true;
      apiClient.checkAndApplyFirmwareUpdate();
    }
    // Settings sync elke 60s (min/max temp, deur-alarm vertraging, controller config)
    if (deviceStatus.connectedToApi && (lastSettingsFetch == 0 || (now - lastSettingsFetch >= 60000))) {
      float mt, Mx;
      int dd;
      String ctrlType;
      int ctrlSlave = 0, ctrlBaud = 0;
      if (apiClient.fetchDeviceSettings(mt, Mx, dd, &ctrlType, &ctrlSlave, &ctrlBaud)) {
        deviceMinTemp = mt;
        deviceMaxTemp = Mx;
        deviceDoorAlarmDelaySec = dd;
        if (ctrlType.length() > 0) {
          controllerTypeFromApi = ctrlType;
          controllerSlaveAddrFromApi = ctrlSlave;
          controllerBaudRateFromApi = ctrlBaud;
        }
        lastSettingsFetch = now;
      }
    }
  } else {
    deviceStatus.connectedToWifi = WiFi.isConnected();
    deviceStatus.connectedToApi = false;
    if (!WiFi.isConnected()) {
      deviceStatus.lastError = "WiFi disconnected";
    } else if (!provisioning.hasAPICredentials()) {
      deviceStatus.lastError = "API not configured";
    }
  }
  
  // Battery check — op carrier v1.1 is er geen battery-ADC (GPIO4 = WDT_DONE).
  // BatteryMonitor is een no-op; we tonen enkel periodiek de VBUS-status.
  if (now - lastBatteryCheck > 60000) { // Every minute
    batteryMonitor.update();
#if !defined(BOARD_BATTERY_MONITOR_DISABLED)
    float voltage = batteryMonitor.getVoltage();
    int percentage = batteryMonitor.getPercentage();

    uint32_t adcMv = batteryMonitor.getLastRawAdcMilliVolts();
    if (voltage < 1.0f) {
      logger.warn(
          String("Batterij <1V! ADC GPIO") + BATTERY_ADC_PIN +
          " = " + adcMv + " mV ruw → " + String(voltage, 2) + " V (na deler+kalibr.)");
    } else {
      logger.info(String("Batterij: ") + String(voltage, 2) + " V (" + percentage + "%)"
                  + " | ADC GPIO" + BATTERY_ADC_PIN + " ruw=" + adcMv + " mV");
    }

    if (powerMonitor.isUsbConnected()) {
      /* USB aangesloten: batterij laadt, skip deep sleep. */
    } else if (voltage < 1.0f) {
      /* Geen batterij: nooit deep sleep. */
    } else {
      if (percentage < 20) logger.warn("Low battery warning!");
      if (percentage < 10) {
        logger.error("Critical battery! Entering deep sleep...");
        powerManager.enterDeepSleep(3600);
      }
    }
#else
    logger.debug(String("Voeding: ") + (powerMonitor.isUsbConnected() ? "externe VBUS aanwezig" : "batterij/onbekend"));
#endif

    lastBatteryCheck = now;
  }
  
  // Uploads (alle HTTP in loop = zelfde core als WiFi, voorkomt Invalid mbox crash)
  if (WiFi.isConnected() && provisioning.hasAPICredentials()) {
    // DEUR EVENTS – single upload (batch endpoint gaf 500; single werkt stabiel)
    static DoorEvent retryEv;
    static bool hasRetry = false;
    if (hasRetry) {
      const char* st = retryEv.isOpen ? "OPEN" : "CLOSED";
      if (apiClient.uploadDoorEvent(st, retryEv.seq, retryEv.timestamp, retryEv.rssi, retryEv.uptimeMs)) {
        hasRetry = false;
        logger.info("Deur-event retry OK");
      }
    }
    if (!hasRetry && doorEventManager.hasPending()) {
      DoorEvent ev;
      if (doorEventManager.dequeue(ev)) {
        const char* st = ev.isOpen ? "OPEN" : "CLOSED";
        if (apiClient.uploadDoorEvent(st, ev.seq, ev.timestamp, ev.rssi, ev.uptimeMs)) {
          logger.info("Deur-event verstuurd");
        } else {
          retryEv = ev;
          hasRetry = true;
          logger.warn("Deur-event upload mislukt, retry later");
        }
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
  
  // Deep sleep alleen als WiFi weg is ÉN USB niet aangesloten ÉN niet in reconnect-window
  // Bij USB-voeding nooit slapen: toestel is bereikbaar en batterij laadt
  if (config.getDeepSleepEnabled()
      && !WiFi.isConnected()
      && !powerMonitor.isUsbConnected()
      && (wifiLostAt == 0 || (now - wifiLostAt >= 120000))) {  // Minstens 2 min wachten voor deep sleep
    deepSleepIfNeeded();
  }
  
    // Snellere loop bij deur-events (10ms) voor directe live-update in app (<500ms)
    delay(doorEventManager.hasPending() ? 10 : 100);
}

void sensorTask(void *parameter) {
  logger.info("Sensor task started");
  
  unsigned long lastReading = 0;
  unsigned long lastDoorCheck = 0;
  unsigned long interval = config.getReadingInterval() * 1000; // ms
  static float lastKnownTemp = 0.0f;
  static bool hasValidReading = false;
  
  while (true) {
    unsigned long now = millis();
    
    // Eerste run: sync deur-state met hardware (voorkomt spurious event)
    static bool doorInitDone = false;
    if (!doorInitDone) {
      doorInitDone = true;
      delay(100);  // Korte stabilisatie na boot
      bool initDoor = sensors.readDoorOnly();
      doorEventManager.setInitialState(initDoor);
      logger.info("Deur init: " + String(initDoor ? "OPEN" : "DICHT") + " (GPIO" + String(PIN_DOOR) + ")");
    }
    
    // Deur elke 15ms checken met debounce (30ms); bij state change direct event in queue (<500ms naar frontend)
    if (now - lastDoorCheck >= 15) {
      bool doorOpen = sensors.readDoorOnly();
      // Debug: elke 5s raw pin loggen (GPIO32) – controleer of pin verandert bij schakelen
      static unsigned long lastDoorDebug = 0;
      if (now - lastDoorDebug >= 5000) {
        lastDoorDebug = now;
        bool pinHigh = (digitalRead(PIN_DOOR) == HIGH);
        logger.info("Deur debug: pin=" + String(pinHigh ? 1 : 0) + " doorOpen=" + String(doorOpen ? 1 : 0) + " (GPIO" + String(PIN_DOOR) + ")");
      }
      if (doorEventManager.poll(doorOpen)) {
        DoorEvent ev;
        ev.isOpen = doorOpen;
        ev.timestamp = getUnixTimeMs() ? getUnixTimeMs() : (uint64_t)now;  // Unix ms of millis fallback
        ev.seq = doorEventManager.getNextSeq();
        ev.rssi = WiFi.isConnected() ? WiFi.RSSI() : 0;
        ev.uptimeMs = now;
        doorEventManager.enqueue(ev);
        logger.info("Deur " + String(doorOpen ? "OPEN" : "DICHT") + " (seq=" + String(ev.seq) + ") – event in queue");
      }
      lastDoorCheck = now;
    }
    
    // Volledige sensorread op interval (temp via MAX31865, deur)
    if (now - lastReading >= interval) {
      SensorData data = sensors.read();
      
      // MAX31865 #1 (primary PT1000) via sensors_pt1000-laag
      float max31865Temp = readSensor(0);
      uint8_t max31865Fault = sensorFault(0);
      bool max31865Ok = max31865Initialized && sensorOk(0) && !isnan(max31865Temp);

      if (max31865Ok) {
        data.temperature = max31865Temp;
        data.valid = true;
        logger.info("MAX31865 | Temp: " + String(data.temperature, 2) + " °C | Deur: " + (data.doorOpen ? "OPEN" : "dicht"));
      } else {
        // Altijd MAX31865-status én deur tonen in Serial Monitor voor debugging
        logger.warn("MAX31865 | GEEN DATA | fault=0x" + String(max31865Fault, HEX) + 
                    " temp=" + String(max31865Temp, 1) + " | Deur: " + (data.doorOpen ? "OPEN" : "dicht") +
                    " (pin=" + String(data.doorPinHigh ? 1 : 0) + ")");
      }
      
      if (data.valid) {
        lastKnownTemp = data.temperature;
        hasValidReading = true;

        batteryMonitor.update();
        powerMonitor.update();
        bool usbConnected = powerMonitor.isUsbConnected();
        float vUsb = powerMonitor.getUsbVoltage();
        int batPct = batteryMonitor.getPercentage();
        (void)vUsb;  /* Op carrier digitaal gemeten; analog-drempel niet van toepassing. */
        bool charging = usbConnected && (batPct > 0) && (batPct < 100);

        DynamicJsonDocument doc(512);
        doc["deviceId"] = getEffectiveDeviceSerial();
        doc["temperature"] = round(data.temperature * 10) / 10.0;  // 1 decimaal
        doc["doorStatus"] = data.doorOpen;
        /* Carrier: VBUS_DETECT is digitaal, dus powerStatus is altijd geldig. */
        doc["powerStatus"] = usbConnected;
        doc["batteryLevel"] = batPct;
        doc["batteryVoltage"] = batteryMonitor.getVoltage();
        doc["batteryCharging"] = charging;
        doc["timestamp"] = now;

        String jsonData;
        serializeJson(doc, jsonData);
        dataBuffer.add(jsonData);
        
        logger.debug("Reading buffered");
      } else {
        logger.warn(String("No valid sensor reading! Deur: ") + (data.doorOpen ? "OPEN" : "dicht") + " (pin=" + String(data.doorPinHigh ? 1 : 0) + ")");
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
  const unsigned long checkInterval = 10000; // Check every 10 seconds (snellere feedback bij ontdooiing)
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
    
    // Only check if WiFi connected and RS485 enabled (Modbus or Carel)
    bool rs485Active = config.getModbusEnabled() || config.getCarelProtocolEnabled();
    bool writeAllowed = config.getCarelProtocolEnabled() || config.getModbusWriteEnabled();
    if (WiFi.isConnected() && rs485Active && writeAllowed) {
      if (now - lastCheck >= checkInterval) {
        lastCheck = now;
        logger.info("Command task: polling for pending commands");
        
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
            DynamicJsonDocument result(512);

            // Carrier-PCB relay: protocol-onafhankelijk, vóór Carel/Modbus-dispatch
            if (commandType == "RELAY_ON") {
              setRelay(true);
              success = true;
              result["relay_state"] = true;
              apiClient.completeCommand(commandId, success, result);
              continue;
            } else if (commandType == "RELAY_OFF") {
              setRelay(false);
              success = true;
              result["relay_state"] = false;
              apiClient.completeCommand(commandId, success, result);
              continue;
            }

            // API controller_type overrides config when set
            bool useCarel = config.getCarelProtocolEnabled();
            if (controllerTypeFromApi.length() > 0) {
              useCarel = (controllerTypeFromApi.indexOf("CAREL_PJEZ") >= 0);
            }

            if (useCarel) {
              // Carel PJEZ supervisie protocol
              if (commandType == "DEFROST_START") {
                logger.info("Carel: DEFROST_START");
                success = carel.startDefrost();
                if (success) result["status"] = "defrost_started";
                else result["error"] = "Carel defrost start failed";
              } else if (commandType == "DEFROST_STOP") {
                logger.info("Carel: DEFROST_STOP");
                success = carel.stopDefrost();
                if (success) result["status"] = "defrost_stopped";
                else result["error"] = "Carel defrost stop failed";
              } else if (commandType == "READ_TEMPERATURE") {
                logger.info("Carel: READ_TEMPERATURE");
                float temp = carel.readTemperature();
                if (!isnan(temp)) {
                  success = true;
                  result["temperature"] = temp;
                  logger.info("Carel temp: " + String(temp) + " °C");
                } else {
                  result["error"] = "Carel temperature read failed";
                }
              } else if (commandType == "READ_DEFROST_PARAMS") {
                logger.info("Carel: READ_DEFROST_PARAMS");
                int type, interval, duration;
                if (carel.readDefrostParams(type, interval, duration)) {
                  success = true;
                  result["defrostType"] = type;
                  result["defrostInterval"] = interval;
                  result["defrostDuration"] = duration;
                } else {
                  result["error"] = "Carel read params failed";
                }
              } else if (commandType == "SET_DEFROST_INTERVAL") {
                int hours = parametersDoc["hours"] | 6;
                logger.info("Carel: SET_DEFROST_INTERVAL " + String(hours));
                success = carel.setDefrostInterval(hours);
                if (success) result["status"] = "ok";
                else result["error"] = "Carel set interval failed";
              } else if (commandType == "SET_DEFROST_DURATION") {
                int minutes = parametersDoc["minutes"] | 20;
                logger.info("Carel: SET_DEFROST_DURATION " + String(minutes));
                success = carel.setDefrostDuration(minutes);
                if (success) result["status"] = "ok";
                else result["error"] = "Carel set duration failed";
              } else if (commandType == "SET_DEFROST_TYPE") {
                int type = parametersDoc["type"] | 0;
                logger.info("Carel: SET_DEFROST_TYPE " + String(type));
                success = carel.setDefrostType(type);
                if (success) result["status"] = "ok";
                else result["error"] = "Carel set type failed";
              } else {
                logger.warn("Carel: unknown command " + commandType);
                result["error"] = "Unknown command type";
              }
            } else {
              // Modbus RTU – adressen per controller type (Dixell 0x0000, Eliwell 0x0100, Carel IR33 reg 1/2)
              uint16_t tempAddr = 0x0000, setpointAddr = 0x0001, defrostCoil = 0x0001, alarmCoil = 0x0003;
              if (controllerTypeFromApi.indexOf("ELIWELL") >= 0) {
                tempAddr = 0x0100; setpointAddr = 0x0101; defrostCoil = 0x0000; alarmCoil = 0x0001;
              } else if (controllerTypeFromApi.indexOf("CAREL_IR33") >= 0) {
                tempAddr = 2; setpointAddr = 1; defrostCoil = DEFROST_COIL_ADDR; alarmCoil = 6;
              }
              if (commandType == "DEFROST_START") {
                logger.info("Executing DEFROST_START command...");
                modbus.setDefrostDebug(true);
                if (modbus.writeSingleRegister(DEFROST_REG_ADDR, 1)) {
                  success = true;
                  result["status"] = "defrost_started";
                } else if (modbus.writeSingleCoil(defrostCoil, true)) {
                  success = true;
                  result["status"] = "defrost_started";
                } else if (modbus.writeSingleCoil(DEFROST_REG_ADDR, true)) {
                  success = true;
                  result["status"] = "defrost_started";
                } else {
                  result["error"] = "RS485 write failed. Zie Serial Monitor.";
                }
                modbus.setDefrostDebug(false);
              } else if (commandType == "DEFROST_STOP") {
                if (modbus.writeSingleRegister(DEFROST_REG_ADDR, 0) || modbus.writeSingleCoil(defrostCoil, false)) {
                  success = true;
                  result["status"] = "defrost_stopped";
                } else {
                  result["error"] = "RS485 write failed";
                }
              } else if (commandType == "READ_TEMPERATURE") {
                if (modbus.readInputRegisters(tempAddr, 2)) {
                  float temp = modbus.getFloat(0);
                  success = true;
                  result["temperature"] = temp;
                } else if (modbus.readHoldingRegisters(tempAddr, 2)) {
                  float temp = modbus.getFloat(0);
                  success = true;
                  result["temperature"] = temp;
                } else {
                  result["error"] = "RS485 read failed";
                }
              } else if (commandType == "READ_SETPOINT") {
                if (modbus.readHoldingRegisters(setpointAddr, 2)) {
                  float sp = modbus.getFloat(0);
                  success = true;
                  result["setpoint"] = sp;
                } else {
                  result["error"] = "RS485 read failed";
                }
              } else if (commandType == "READ_ALARM_STATUS") {
                if (modbus.readHoldingRegisters(6, 2)) {
                  uint16_t v = modbus.getRegister(0);
                  success = true;
                  result["alarm"] = (v != 0);
                } else if (modbus.readHoldingRegisters(alarmCoil, 1)) {
                  success = true;
                  result["alarm"] = (modbus.getRegister(0) != 0);
                } else {
                  result["error"] = "RS485 read failed";
                }
              } else if (commandType == "SET_SETPOINT") {
                int val = parametersDoc["value"] | parametersDoc["temperature"] | -999;
                if (val > -500) {
                  uint16_t regVal = (uint16_t)(val * 10);  // Veel regelaars: x10
                  if (modbus.writeSingleRegister(setpointAddr, regVal)) {
                    success = true;
                    result["status"] = "ok";
                  } else {
                    result["error"] = "RS485 write failed";
                  }
                } else {
                  result["error"] = "Missing value parameter";
                }
              } else if (commandType == "ALARM_RESET") {
                if (modbus.writeSingleCoil(alarmCoil, true)) {
                  success = true;
                  result["status"] = "ok";
                } else {
                  result["error"] = "RS485 write failed";
                }
              } else if (commandType == "POWER_ON_OFF") {
                int val = parametersDoc["value"] | 1;
                if (modbus.writeSingleRegister(101, val)) {
                  success = true;
                  result["status"] = "ok";
                } else {
                  result["error"] = "RS485 write failed";
                }
              } else {
                logger.warn("Unknown command type: " + commandType);
                result["error"] = "Unknown command type";
              }
            }

            // Report command completion
            if (ESP.getFreeHeap() > 5000) {
              DynamicJsonDocument resultDoc(512);
              if (result.containsKey("status")) {
                resultDoc["status"] = result["status"].as<String>();
              }
              if (result.containsKey("temperature")) {
                resultDoc["temperature"] = result["temperature"].as<float>();
              }
              if (result.containsKey("defrostType")) {
                resultDoc["defrostType"] = result["defrostType"].as<int>();
              }
              if (result.containsKey("defrostInterval")) {
                resultDoc["defrostInterval"] = result["defrostInterval"].as<int>();
              }
              if (result.containsKey("defrostDuration")) {
                resultDoc["defrostDuration"] = result["defrostDuration"].as<int>();
              }
              if (result.containsKey("setpoint")) {
                resultDoc["setpoint"] = result["setpoint"].as<float>();
              }
              if (result.containsKey("alarm")) {
                resultDoc["alarm"] = result["alarm"].as<bool>();
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
    
    // Check reset knop periodiek (BOOT 3s = factory reset)
    if (resetButton.check()) {
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
  
  const unsigned long SEARCH_PHASE_MS = 3 * 60 * 1000;   // 3 min zoeken
  const unsigned long PORTAL_PHASE_SEC = 180;             // 3 min config portal
  const unsigned long CONNECT_ATTEMPT_MS = 30000;         // 30s per connect-poging
  wifiManager.setConfigPortalTimeout(PORTAL_PHASE_SEC);
  wifiManager.setConnectTimeout(20);        // 20 seconden per autoConnect-poging
  
  // Check provisioning state
  bool isProvisioned = provisioning.isProvisioned();
  bool hasWiFi = provisioning.hasWiFiCredentials();
  bool hasAPI = provisioning.hasAPICredentials();
  
  // Determine if we need config portal
  // ALWAYS start portal if provisioning is not complete
  bool needsConfigPortal = (!isProvisioned || !hasWiFi || !hasAPI);
  
  if (needsConfigPortal) {
    logger.warn("========================================");
    logger.warn("BOOT: Eerste start: geen configuratie -> start " WIFI_SETUP_AP_SSID);
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
    
    bool portalStarted = wifiManager.startConfigPortal(WIFI_SETUP_AP_SSID);
    
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
      // Setup WiFiManager met opgeslagen waarden
      String apiUrl = provisioning.getAPIUrl();
      String apiKey = provisioning.getAPIKey();
      String deviceSerial = getEffectiveDeviceSerial();
      wifiManager.setupColdMonitorParams(apiUrl.c_str(), apiKey.c_str(), deviceSerial.c_str());
      wifiManager.setOnSaveParamsCallback(onWifiParamsSaved);

      // Alternerende loop: 3 min zoeken -> 3 min portal -> herhaal (modem kan nog opstarten)
      bool connected = false;
      while (!connected) {
        // FASE 1: Zoeken (3 min) – probeer elke 30s
        logger.info("WIFI: Zoekfase – probeer te verbinden (max " + String(SEARCH_PHASE_MS / 1000) + "s)...");
        unsigned long searchStart = millis();
        while (!connected && (millis() - searchStart < SEARCH_PHASE_MS)) {
          logger.info("WIFI: Connect-poging...");
          connected = wifiManager.autoConnect(WIFI_SETUP_AP_SSID);
          if (!connected) {
            WiFi.disconnect(false);  // Niet wissen – credentials behouden
            delay(500);
            if (millis() - searchStart < SEARCH_PHASE_MS) {
              unsigned long remaining = (SEARCH_PHASE_MS - (millis() - searchStart)) / 1000;
              logger.warn("WIFI: Mislukt – volgende poging over 30s (nog " + String(remaining) + "s zoeken)");
              delay(CONNECT_ATTEMPT_MS - 500);  // ~30s tussen pogingen
            }
          }
        }

        if (connected) break;

        // FASE 2: Config portal (3 min) – gebruiker kan handmatig configureren
        logger.warn("WIFI: Na " + String(SEARCH_PHASE_MS / 1000) + "s niet verbonden – config portal open (3 min)");
        logger.warn("WIFI: Modem mogelijk nog aan het opstarten – portal sluit automatisch en zoekt opnieuw");
        wifiManager.startConfigPortal(WIFI_SETUP_AP_SSID);
        // Na timeout: credentials NIET wissen – gebruiker kan iets hebben ingevoerd
        WiFi.disconnect(false);
        delay(500);
      }

      // Connected successfully
      String currentSSID = WiFi.SSID();
      String currentPass = WiFi.psk();  // Werkt alleen als verbonden – nu kunnen we het wachtwoord ophalen
      String currentIP = WiFi.localIP().toString();
      
      // Backfill: als we "saved_by_wifimanager" hadden, nu het echte wachtwoord in provisioning zetten
      if (currentPass.length() > 0) {
        provisioning.setWiFiCredentials(currentSSID, currentPass);
        logger.info("WIFI: Wachtwoord opgeslagen in provisioning (was via WiFiManager)");
      }
      
      logger.info("========================================");
      logger.info("WIFI: NETWERK ONLINE");
      logger.info("  SSID: " + currentSSID);
      logger.info("  IP: " + currentIP);
      logger.info("  RSSI: " + String(WiFi.RSSI()) + " dBm");
      logger.info("  Gebruikt opgeslagen API-instellingen");
      logger.info("========================================");
      
      initNtpTime();  // Sync tijd voor Unix timestamps in deur-events
      
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
      int batPct = -1;
      bool onMains = false;
      if (batteryMonitor.getVoltage() >= 1.0f) batPct = batteryMonitor.getPercentage();
      if (powerMonitor.isUsbConnected()) onMains = true;
      bool apiOk = apiClient.apiHandshakeOrHeartbeat(true, WiFi.RSSI(), WiFi.localIP().toString(), batPct, onMains);
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
  }  // End else (credentials)
  
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
    
    if (wifiManager.startConfigPortal(WIFI_SETUP_AP_SSID)) {
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
