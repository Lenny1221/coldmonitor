#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>

class WiFiManagerWrapper {
private:
  ::WiFiManager wifiManager;
  bool connected;
  
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
  bool autoConnect(String apName);
};

#endif
