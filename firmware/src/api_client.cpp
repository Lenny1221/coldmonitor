#include "api_client.h"
#include "logger.h"
#include "config.h"

extern Logger logger;
extern ConfigManager config;

APIClient::APIClient() {
}

APIClient::~APIClient() {
  http.end();
}

void APIClient::setAPIUrl(String url) {
  apiUrl = url;
}

void APIClient::setAPIKey(String key) {
  apiKey = key;
}

bool APIClient::uploadReading(String jsonData) {
  if (!WiFi.isConnected()) {
    logger.warn("WiFi not connected, cannot upload");
    return false;
  }
  
  if (apiUrl.length() == 0) {
    logger.error("API URL not configured");
    return false;
  }
  
  // Parse JSON to get serial number
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, jsonData);
  
  if (error) {
    logger.error("Failed to parse JSON data");
    return false;
  }
  
  String serialNumber = doc["deviceId"] | config.getDeviceSerial();
  
  // Construct URL
  String url = apiUrl + "/readings/devices/" + serialNumber + "/readings";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", apiKey);
  
  int httpCode = http.POST(jsonData);
  
  bool success = (httpCode == 200 || httpCode == 201);
  
  if (success) {
    logger.debug("Upload successful: " + String(httpCode));
  } else {
    logger.warn("Upload failed: " + String(httpCode));
    String response = http.getString();
    logger.debug("Response: " + response);
  }
  
  http.end();
  
  return success;
}

bool APIClient::uploadReadings(String jsonArray) {
  // For batch uploads (if supported by API)
  // Similar to uploadReading but sends array
  return false;
}

bool APIClient::checkConnection() {
  if (!WiFi.isConnected()) {
    return false;
  }
  
  String url = apiUrl + "/health";
  http.begin(url);
  
  int httpCode = http.GET();
  bool success = (httpCode == 200);
  
  http.end();
  
  return success;
}

String APIClient::getDeviceInfo() {
  // Get device information from API
  return "";
}
