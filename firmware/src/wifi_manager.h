#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>

#define API_URL_LEN 128
#define API_KEY_LEN 64
#define DEVICE_SERIAL_LEN 48

class WiFiManagerWrapper {
private:
  ::WiFiManager wifiManager;
  bool connected;
  WiFiManagerParameter* paramApiUrl;
  WiFiManagerParameter* paramApiKey;
  WiFiManagerParameter* paramDeviceSerial;
  void (*onSaveParamsCb)(const char* apiUrl, const char* apiKey, const char* deviceSerial);
  
public:
  WiFiManagerWrapper();
  ~WiFiManagerWrapper();
  
  bool connect(String ssid, String password);
  bool disconnect();
  bool isConnected();
  String getSSID();
  IPAddress getIP();
  int getRSSI();
  void setConfigPortalTimeout(unsigned long seconds);
  
  // Setup API URL + API key + serienummer voor config portal
  void setupColdMonitorParams(const char* apiUrlDefault, const char* apiKeyDefault, const char* deviceSerialDefault);
  // Haal ingevoerde waarden op na save
  void getColdMonitorParams(String& apiUrl, String& apiKey, String& deviceSerial);
  // Callback na save: ontvangt apiUrl en apiKey
  void setOnSaveParamsCallback(void (*cb)(const char* apiUrl, const char* apiKey, const char* deviceSerial));
  void handleSaveParams();  // intern gebruikt door save callback
  
  // Forceer config portal (voor eerste setup of reconfiguratie)
  bool startConfigPortal(String apName);
  bool autoConnect(String apName);
};

#endif
