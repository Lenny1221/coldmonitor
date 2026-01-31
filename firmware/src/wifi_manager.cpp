#include "wifi_manager.h"
#include "logger.h"

extern Logger logger;

WiFiManagerWrapper::WiFiManagerWrapper() : connected(false) {
}

WiFiManagerWrapper::~WiFiManagerWrapper() {
}

bool WiFiManagerWrapper::connect(String ssid, String password) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  
  connected = (WiFi.status() == WL_CONNECTED);
  
  if (connected) {
    logger.info("WiFi connected: " + WiFi.SSID());
    logger.info("IP: " + WiFi.localIP().toString());
  } else {
    logger.error("WiFi connection failed");
  }
  
  return connected;
}

bool WiFiManagerWrapper::disconnect() {
  WiFi.disconnect();
  connected = false;
  return true;
}

bool WiFiManagerWrapper::isConnected() {
  connected = (WiFi.status() == WL_CONNECTED);
  return connected;
}

String WiFiManagerWrapper::getSSID() {
  return WiFi.SSID();
}

IPAddress WiFiManagerWrapper::getIP() {
  return WiFi.localIP();
}

int WiFiManagerWrapper::getRSSI() {
  return WiFi.RSSI();
}

void WiFiManagerWrapper::setConfigPortalTimeout(unsigned long seconds) {
  wifiManager.setConfigPortalTimeout(seconds);
}

bool WiFiManagerWrapper::autoConnect(String apName) {
  if (!wifiManager.autoConnect(apName.c_str())) {
    logger.error("Failed to connect and hit timeout");
    return false;
  }
  
  connected = true;
  logger.info("WiFi connected via portal");
  return true;
}
