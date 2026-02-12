#include "wifi_manager.h"
#include "logger.h"
#include <qrcode.h>

extern Logger logger;

// Bouwt HTML voor QR-code (WIFI-connectie) + pre-fill script voor API-velden uit URL-params
static String buildConfigPortalCustomHtml(const String& apName) {
  String wifiPayload = "WIFI:T:nopass;S:" + apName + ";;";
  const char* payload = wifiPayload.c_str();

  // QRCode-buffer (version 3 = 29x29 modules)
  #define QR_VERSION 3
  uint8_t qrcodeData[qrcode_getBufferSize(QR_VERSION)];
  QRCode qrcode;
  qrcode_initText(&qrcode, qrcodeData, QR_VERSION, ECC_LOW, payload);

  const int size = qrcode.size;
  const int cellPx = 3;

  String html;
  html.reserve(3200);
  html += "<div style='margin:12px 0;text-align:center'>";
  html += "<p style='margin:4px 0;font-weight:bold'>Scan met je telefoon</p>";
  html += "<p style='margin:0 0 8px 0;font-size:12px'>Verbinden met " + apName + " en config openen</p>";
  html += "<table style='border-collapse:collapse;margin:0 auto;display:inline-block' cellspacing='0' cellpadding='0'><tbody>";
  for (int y = 0; y < size; y++) {
    html += "<tr>";
    for (int x = 0; x < size; x++) {
      bool black = qrcode_getModule(&qrcode, x, y);
      html += "<td style='width:" + String(cellPx) + "px;height:" + String(cellPx) + "px;background:";
      html += black ? "#000" : "#fff";
      html += "'></td>";
    }
    html += "</tr>";
  }
  html += "</tbody></table></div>";
  // Pre-fill API URL, API key en serial uit query string (voor link/QR uit app)
  html += "<script>(function(){var s=window.location.search;if(!s)return;var p=new URLSearchParams(s);"
          "var u=p.get('apiurl');if(u){var e=document.querySelector('[name=\"apiurl\"]');if(e)e.value=decodeURIComponent(u);}"
          "var k=p.get('apikey');if(k){var e=document.querySelector('[name=\"apikey\"]');if(e)e.value=decodeURIComponent(k);}"
          "var r=p.get('serial');if(r){var e=document.querySelector('[name=\"serial\"]');if(e)e.value=decodeURIComponent(r);}"
          "})();</script>";
  return html;
}

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

void WiFiManagerWrapper::setConnectTimeout(unsigned long seconds) {
  wifiManager.setConnectTimeout(seconds);
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
  logger.info("========================================");
  logger.info("PORTAL: Starten config portal...");
  logger.info("PORTAL: AP SSID = " + apName);
  logger.info("========================================");
  
  // Light reset - WiFiManager doet de rest
  WiFi.disconnect(true, true);
  delay(200);
  WiFi.mode(WIFI_OFF);
  delay(300);
  
  // QR-code en custom velden
  static String customHtml;
  customHtml = buildConfigPortalCustomHtml(apName);
  wifiManager.setCustomBodyFooter(customHtml.c_str());
  
  // Laat WiFiManager alles doen - geen eigen AP start (veroorzaakte conflict)
  logger.info("PORTAL: WiFiManager start config portal (AP + web)...");
  bool result = wifiManager.startConfigPortal(apName.c_str());
  
  // Verificatie
  IPAddress apIP = WiFi.softAPIP();
  if (apIP.toString() != "0.0.0.0" || result) {
    connected = true;
    logger.info("========================================");
    logger.info("PORTAL: Config portal actief");
    logger.info("PORTAL: AP SSID = " + apName);
    logger.info("PORTAL: AP IP = " + apIP.toString());
    logger.info("PORTAL: Open http://" + apIP.toString() + " in browser");
    logger.info("========================================");
    result = true;
  }
  
  return result;
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

void WiFiManagerWrapper::resetSettings() {
  wifiManager.resetSettings();
}
