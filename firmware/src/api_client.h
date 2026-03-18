#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

class APIClient {
private:
  String apiUrl;
  String apiKey;
  HTTPClient http;
  SemaphoreHandle_t httpMutex;
  unsigned long lastHttpEndMs = 0;  // Cooldown tussen HTTP-calls (voorkomt Invalid mbox)
  
public:
  APIClient();
  ~APIClient();
  
  void setAPIUrl(String url);
  void setAPIKey(String key);
  
  bool uploadReading(String jsonData);
  bool uploadReadings(String jsonArray);
  bool checkConnection();
  String getDeviceInfo();
  
  // POST /devices/heartbeat - meldt device als ONLINE, telemetrie + remote commands
  bool apiHandshakeOrHeartbeat(bool connectedToWifi, int rssi, const String& ip,
    int batteryPercent = -1, bool onMains = false);
  
  // GET /devices/settings - alarm thresholds + controller config
  bool fetchDeviceSettings(float& minTemp, float& maxTemp, int& doorAlarmDelaySeconds,
    String* outControllerType = nullptr, int* outSlaveAddr = nullptr, int* outBaudRate = nullptr);
  
  // Genereer JSON status voor app: connected_to_wifi, connected_to_api, last_error
  String publishStatusJson(bool connectedToWifi, bool connectedToApi, const String& lastError);
  
  // Command handling
  bool getPendingCommand(String& commandType, String& commandId, DynamicJsonDocument& parameters);
  bool completeCommand(const String& commandId, bool success, const DynamicJsonDocument& result);
  
  // Remote command result (PATCH /devices/commands/remote/:commandId)
  bool reportRemoteCommandResult(const char* commandId, const char* status, const char* payloadJson);
  
  // OTA: GET /api/firmware/latest, update if version newer
  bool checkAndApplyFirmwareUpdate();
  
  void setSerialNumber(String serial) { serialNumber = serial; }
  
  // POST /readings/devices/:serial/door-events - single or batch
  bool uploadDoorEvent(const char* state, uint32_t seq, uint64_t timestamp, int rssi, unsigned long uptimeMs);
  bool uploadDoorEventsBatch(const void* events, int count);  // events = DoorEvent*
  
private:
  String serialNumber;
};

#endif
