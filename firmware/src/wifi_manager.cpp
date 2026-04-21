#include "wifi_manager.h"
#include "config.h"
#include "logger.h"
#include "watchdog_tpl5010.h"
#include <qrcode.h>
#include <esp_wifi.h>

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
  // Pre-fill API key en serial uit query string (API URL is vast)
  // setTimeout zodat form-elementen zeker gerenderd zijn
  html += "<script>(function(){var s=window.location.search;if(!s)return;setTimeout(function(){var p=new URLSearchParams(s);"
          "var k=p.get('apikey');if(k){var e=document.querySelector('[name=\"apikey\"]');if(e)e.value=decodeURIComponent(k);}"
          "var r=p.get('serial');if(r){var e=document.querySelector('[name=\"serial\"]');if(e)e.value=decodeURIComponent(r);}"
          "},150);})();</script>";
  return html;
}

static WiFiManagerWrapper* s_wifiWrapper = nullptr;

// Klem WiFi-zendvermogen op 8.5 dBm (max_tx_power in 0.25 dBm-stappen: 34).
// Voorkomt brown-out / POWERON-reset op LilyGO via carrier/USB-CDC bij hoge
// startup-piek. 8.5 dBm is genoeg voor lokale AP en de meeste huis-SSIDs.
static inline void clampWifiTxPowerLow() {
  esp_wifi_set_max_tx_power(34);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
}

WiFiManagerWrapper::WiFiManagerWrapper() : connected(false), paramApiKey(nullptr), paramDeviceSerial(nullptr), onSaveParamsCb(nullptr) {
  s_wifiWrapper = this;
}

WiFiManagerWrapper::~WiFiManagerWrapper() {
  if (paramApiKey) { delete paramApiKey; paramApiKey = nullptr; }
  if (paramDeviceSerial) { delete paramDeviceSerial; paramDeviceSerial = nullptr; }
}

bool WiFiManagerWrapper::connect(String ssid, String password) {
  WiFi.mode(WIFI_STA);
  delay(200);
  clampWifiTxPowerLow();
  kickWatchdog();
  WiFi.begin(ssid.c_str(), password.c_str());
  clampWifiTxPowerLow();  // WiFi.begin kan power resetten

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    if ((attempts % 4) == 0) kickWatchdog();  // ~elke 2 s kicken
    attempts++;
  }
  kickWatchdog();
  
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
  (void)apiUrlDefault;  // API URL is vast, niet configureerbaar
  if (paramApiKey) { delete paramApiKey; }
  if (paramDeviceSerial) { delete paramDeviceSerial; }
  paramApiKey = new WiFiManagerParameter("apikey", "API Key (uit ColdMonitor app)", apiKeyDefault, API_KEY_LEN);
  paramDeviceSerial = new WiFiManagerParameter("serial", "Serienummer (zoals in app)", deviceSerialDefault, DEVICE_SERIAL_LEN);
  wifiManager.addParameter(paramApiKey);
  wifiManager.addParameter(paramDeviceSerial);
}

void WiFiManagerWrapper::getColdMonitorParams(String& apiUrl, String& apiKey, String& deviceSerial) {
  apiUrl = FIXED_API_URL;  // Altijd dezelfde URL
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
  
  const int MAX_RETRIES = 3;
  bool result = false;
  
  for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      logger.warn("PORTAL: Retry " + String(attempt) + "/" + String(MAX_RETRIES));
      delay(1000);  // Pauze tussen pogingen
    }
    
    // WiFi-reset: disconnect en laat stack stabiliseren
    // NIET WiFi.disconnect(true, true) – dat wist credentials en veroorzaakt "No wifi saved" bij volgende autoConnect
    // ESP32 WiFi-hardware heeft ~1000ms nodig om vrij te geven na disconnect
    WiFi.disconnect(true, false);
    delay(1500);
    yield();

    // Carrier/USB-CDC leveren vaak niet genoeg piekstroom als de AP op vol vermogen start
    // → board reset (POWERON loop). Forceer AP-mode met laag zendvermogen vóór startConfigPortal.
    WiFi.mode(WIFI_AP);
    delay(200);
    clampWifiTxPowerLow();
    delay(100);
    yield();

    // QR-code en custom velden
    static String customHtml;
    customHtml = buildConfigPortalCustomHtml(apName);
    wifiManager.setCustomBodyFooter(customHtml.c_str());

    logger.info("PORTAL: WiFiManager start config portal (AP + web, lage TX-power)...");
    kickWatchdog();
    wifiManager.setWebServerCallback([]() { kickWatchdog(); });
    result = wifiManager.startConfigPortal(apName.c_str());
    kickWatchdog();
    clampWifiTxPowerLow();  // WiFiManager kan softAP-power terugzetten
    
    // Verificatie: controleer of AP echt draait
    IPAddress apIP = WiFi.softAPIP();
    if (apIP.toString() != "0.0.0.0") {
      connected = true;
      logger.info("========================================");
      logger.info("PORTAL: Config portal actief");
      logger.info("PORTAL: AP SSID = " + apName);
      logger.info("PORTAL: AP IP = " + apIP.toString());
      logger.info("PORTAL: Verbind met " + apName + " en open http://" + apIP.toString());
      logger.info("========================================");
      return true;
    }
    
    if (result) {
      // Library zegt success maar AP niet zichtbaar – retry
      logger.warn("PORTAL: AP IP is 0.0.0.0 – portal niet gestart, retry...");
    } else {
      logger.warn("PORTAL: startConfigPortal mislukt, retry...");
    }
  }
  
  logger.error("PORTAL: Config portal kon na " + String(MAX_RETRIES) + " pogingen niet starten");
  return false;
}

bool WiFiManagerWrapper::autoConnect(String apName) {
  // Klem vóór autoConnect: WiFiManager initialiseert intern STA én kan AP-fallback starten.
  // Beide paden mogen op carrier/USB geen hoge TX-piek hebben.
  clampWifiTxPowerLow();
  kickWatchdog();
  wifiManager.setWebServerCallback([]() { kickWatchdog(); });
  bool ok = wifiManager.autoConnect(apName.c_str());
  kickWatchdog();
  clampWifiTxPowerLow();  // opnieuw klemmen: WiFi.begin in WiFiManager reset power
  if (!ok) {
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
