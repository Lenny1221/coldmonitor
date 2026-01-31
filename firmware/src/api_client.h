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
};

#endif
