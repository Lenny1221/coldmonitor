#include "wifi_manager.h"
#include "logger.h"

extern Logger logger;

static WiFiManagerWrapper* s_wifiWrapper = nullptr;

WiFiManagerWrapper::WiFiManagerWrapper() : connected(false), paramApiUrl(nullptr), paramApiKey(nullptr), paramDeviceSerial(nullptr), onSaveParamsCb(nullptr) {
  s_wifiWrapper = this;
}

WiFiManagerWrapper::~WiFiManagerWrapper() {
  if (paramApiUrl) { delete paramApiUrl; paramApiUrl = nullptr; }
  if (paramApiKey) { delete paramApiKey; paramApiKey = nullptr; }
  if (paramDeviceSerial) { delete paramDeviceSerial; paramDeviceSerial = nullptr; }
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

void WiFiManagerWrapper::setupColdMonitorParams(const char* apiUrlDefault, const char* apiKeyDefault, const char* deviceSerialDefault) {
  if (paramApiUrl) { delete paramApiUrl; }
  if (paramApiKey) { delete paramApiKey; }
  if (paramDeviceSerial) { delete paramDeviceSerial; }
  paramApiUrl = new WiFiManagerParameter("apiurl", "API URL (bijv. https://xxx.railway.app/api)", apiUrlDefault, API_URL_LEN);
  paramApiKey = new WiFiManagerParameter("apikey", "API Key (uit ColdMonitor app)", apiKeyDefault, API_KEY_LEN);
  paramDeviceSerial = new WiFiManagerParameter("serial", "Serienummer (zoals in app)", deviceSerialDefault, DEVICE_SERIAL_LEN);
  wifiManager.addParameter(paramApiUrl);
  wifiManager.addParameter(paramApiKey);
  wifiManager.addParameter(paramDeviceSerial);
}

void WiFiManagerWrapper::getColdMonitorParams(String& apiUrl, String& apiKey, String& deviceSerial) {
  if (paramApiUrl) apiUrl = String(paramApiUrl->getValue());
  else apiUrl = "";
  if (paramApiKey) apiKey = String(paramApiKey->getValue());
  else apiKey = "";
  if (paramDeviceSerial) deviceSerial = String(paramDeviceSerial->getValue());
  else deviceSerial = "";
}

static void wifiSaveConfigCallback() {
  if (s_wifiWrapper) {
    s_wifiWrapper->handleSaveParams();
  }
}

void WiFiManagerWrapper::handleSaveParams() {
  if (onSaveParamsCb) {
    String u, k, s;
    getColdMonitorParams(u, k, s);
    onSaveParamsCb(u.c_str(), k.c_str(), s.c_str());
  }
}

void WiFiManagerWrapper::setOnSaveParamsCallback(void (*cb)(const char* apiUrl, const char* apiKey, const char* deviceSerial)) {
  onSaveParamsCb = cb;
  wifiManager.setSaveConfigCallback(cb ? wifiSaveConfigCallback : nullptr);
}

bool WiFiManagerWrapper::startConfigPortal(String apName) {
  logger.info("Starting config portal: " + apName);
  WiFi.mode(WIFI_AP_STA);  // Zorg dat AP kan worden aangemaakt
  if (!wifiManager.startConfigPortal(apName.c_str())) {
    logger.error("Config portal failed");
    return false;
  }
  connected = true;
  logger.info("WiFi configured and connected");
  return true;
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
