#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>

class APIClient {
private:
  String apiUrl;
  String apiKey;
  HTTPClient http;
  
public:
  APIClient();
  ~APIClient();
  
  void setAPIUrl(String url);
  void setAPIKey(String key);
  
  bool uploadReading(String jsonData);
  bool uploadReadings(String jsonArray);
  bool checkConnection();
  String getDeviceInfo();
  
  // Command handling
  bool getPendingCommand(String& commandType, String& commandId, DynamicJsonDocument& parameters);
  bool completeCommand(const String& commandId, bool success, const DynamicJsonDocument& result);
  
  void setSerialNumber(String serial) { serialNumber = serial; }
  
private:
  String serialNumber;
};

#endif
