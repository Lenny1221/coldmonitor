#include "api_client.h"
#include "logger.h"
#include "config.h"

extern Logger logger;
extern ConfigManager config;

APIClient::APIClient() : serialNumber("") {
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
    logger.error("API URL not configured - check config in NVS");
    logger.error("Current API URL from config: " + config.getAPIUrl());
    logger.error("Current API Key from config: " + (config.getAPIKey().length() > 0 ? String(config.getAPIKey().substring(0, 8)) + "..." : "(leeg)"));
    // Try to reload from config
    apiUrl = config.getAPIUrl();
    apiKey = config.getAPIKey();
    if (apiUrl.length() == 0) {
      logger.error("API URL still empty after reload - device needs reconfiguration");
      return false;
    }
    logger.info("Reloaded API URL from config: " + apiUrl);
  }
  
  if (apiKey.length() == 0) {
    logger.error("API Key not configured - check config in NVS");
    apiKey = config.getAPIKey();
    if (apiKey.length() == 0) {
      logger.error("API Key still empty after reload - device needs reconfiguration");
      return false;
    }
    logger.info("Reloaded API Key from config");
  }
  
  // Parse JSON to get serial number
  DynamicJsonDocument doc(512);
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
  http.setConnectTimeout(15000);  // 15 s verbinding
  http.setTimeout(10000);        // 10 s antwoord
  
  int httpCode = http.POST(jsonData);
  
  bool success = (httpCode == 200 || httpCode == 201);
  
  if (success) {
    logger.debug("Upload successful: " + String(httpCode));
  } else {
    const char* errMsg = nullptr;
    if (httpCode == -1) errMsg = "connection refused / DNS failed";
    else if (httpCode == -2) errMsg = "send header failed (check URL, WiFi, backend online)";
    else if (httpCode == -3) errMsg = "send payload failed";
    else if (httpCode == -4) errMsg = "not connected";
    else if (httpCode == -5) errMsg = "connection lost";
    else if (httpCode == -11) errMsg = "timeout";
    if (errMsg) {
      logger.warn("Upload failed: " + String(httpCode) + " " + String(errMsg));
      if (httpCode == -1) {
        logger.warn("TIP: Controleer API URL - gebruik https:// voor Railway, of je computer-IP (niet localhost) voor lokaal testen");
      }
    } else {
      logger.warn("Upload failed: " + String(httpCode));
    }
    String response = http.getString();
    if (response.length() > 0) {
      logger.debug("Response: " + response);
    }
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

bool APIClient::apiHandshakeOrHeartbeat(bool connectedToWifi, int rssi, const String& ip) {
  if (!WiFi.isConnected() || apiUrl.length() == 0 || apiKey.length() == 0 || serialNumber.length() == 0) {
    return false;
  }
  
  String url = apiUrl + "/devices/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", apiKey);
  http.setConnectTimeout(15000);
  http.setTimeout(10000);
  
  DynamicJsonDocument doc(512);
  doc["deviceId"] = WiFi.macAddress();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ip"] = ip.length() > 0 ? ip : WiFi.localIP().toString();
  doc["rssi"] = rssi;
  doc["uptime"] = millis() / 1000;
  doc["connected_to_wifi"] = connectedToWifi;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  int httpCode = http.POST(jsonData);
  bool success = (httpCode == 200 || httpCode == 201);
  
  http.end();
  
  if (success) {
    logger.debug("Heartbeat OK: " + String(httpCode));
  } else {
    const char* errMsg = nullptr;
    if (httpCode == -1) errMsg = "connection refused / DNS failed";
    else if (httpCode == -2) errMsg = "send header failed";
    else if (httpCode == -3) errMsg = "send payload failed";
    else if (httpCode == -4) errMsg = "not connected";
    else if (httpCode == -5) errMsg = "connection lost";
    else if (httpCode == -11) errMsg = "timeout";
    else if (httpCode == 401) errMsg = "invalid API key";
    else if (httpCode == 404) errMsg = "endpoint not found";
    if (errMsg) {
      logger.warn("Heartbeat failed: " + String(httpCode) + " " + String(errMsg));
    } else {
      logger.warn("Heartbeat failed: " + String(httpCode));
    }
  }
  
  return success;
}

bool APIClient::fetchDeviceSettings(float& minTemp, float& maxTemp, int& doorAlarmDelaySeconds) {
  if (!WiFi.isConnected() || apiUrl.length() == 0 || apiKey.length() == 0 || serialNumber.length() == 0) {
    return false;
  }
  
  String url = apiUrl + "/devices/settings";
  http.begin(url);
  http.addHeader("x-device-key", apiKey);
  http.setConnectTimeout(10000);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  bool ok = false;
  
  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(256);
    DeserializationError err = deserializeJson(doc, response);
    if (!err && doc.containsKey("min_temp") && doc.containsKey("max_temp")) {
      minTemp = doc["min_temp"].as<float>();
      maxTemp = doc["max_temp"].as<float>();
      doorAlarmDelaySeconds = doc["door_alarm_delay_seconds"] | 300;
      ok = true;
      logger.info("Settings fetched: min=" + String(minTemp, 1) + " max=" + String(maxTemp, 1) + " doorDelay=" + String(doorAlarmDelaySeconds) + "s");
    }
  }
  
  http.end();
  return ok;
}

String APIClient::publishStatusJson(bool connectedToWifi, bool connectedToApi, const String& lastError) {
  DynamicJsonDocument doc(256);
  doc["connected_to_wifi"] = connectedToWifi;
  doc["connected_to_api"] = connectedToApi;
  doc["last_error"] = lastError;
  doc["uptime"] = millis() / 1000;
  doc["deviceId"] = WiFi.macAddress();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  
  String json;
  serializeJson(doc, json);
  return json;
}

bool APIClient::getPendingCommand(String& commandType, String& commandId, DynamicJsonDocument& parameters) {
  if (!WiFi.isConnected()) {
    return false;
  }
  
  if (apiUrl.length() == 0 || apiKey.length() == 0 || serialNumber.length() == 0) {
    return false;
  }
  
  String url = apiUrl + "/devices/commands/pending";
  
  http.begin(url);
  http.addHeader("x-device-key", apiKey);
  http.setConnectTimeout(10000);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("commands") && doc["commands"].size() > 0) {
      JsonObject cmd = doc["commands"][0];
      commandId = cmd["id"].as<String>();
      commandType = cmd["commandType"].as<String>();
      if (cmd.containsKey("parameters")) {
        // Copy parameters object
        JsonObject params = cmd["parameters"];
        for (JsonPair pair : params) {
          if (pair.value().is<float>()) {
            parameters[pair.key()] = pair.value().as<float>();
          } else if (pair.value().is<int>()) {
            parameters[pair.key()] = pair.value().as<int>();
          } else if (pair.value().is<bool>()) {
            parameters[pair.key()] = pair.value().as<bool>();
          } else if (pair.value().is<const char*>()) {
            parameters[pair.key()] = pair.value().as<const char*>();
          } else if (pair.value().is<String>()) {
            parameters[pair.key()] = pair.value().as<String>();
          }
        }
      }
      http.end();
      return true;
    }
  }
  
  http.end();
  return false;
}

bool APIClient::completeCommand(const String& commandId, bool success, const DynamicJsonDocument& result) {
  if (!WiFi.isConnected()) {
    return false;
  }
  
  if (apiUrl.length() == 0 || apiKey.length() == 0 || serialNumber.length() == 0) {
    return false;
  }
  
  String url = apiUrl + "/devices/commands/" + commandId + "/complete";
  
  DynamicJsonDocument doc(512);
  doc["result"] = result;
  if (!success) {
    doc["error"] = "Command execution failed";
  }
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", apiKey);
  http.setConnectTimeout(10000);
  http.setTimeout(5000);
  
  int httpCode = http.PATCH(jsonData);
  bool ok = (httpCode == 200);
  
  http.end();
  return ok;
}
