#include "ota_update.h"
#include "logger.h"
#include <WiFi.h>

extern Logger logger;

OTAUpdate::OTAUpdate() : initialized(false) {
}

OTAUpdate::~OTAUpdate() {
  ArduinoOTA.end();
}

bool OTAUpdate::init(String password) {
  this->password = password;
  
  ArduinoOTA.setHostname("ColdMonitor-ESP32");
  ArduinoOTA.setPassword(password.c_str());
  
  ArduinoOTA.onStart([]() {
    logger.info("OTA update started");
  });
  
  ArduinoOTA.onEnd([]() {
    logger.info("OTA update finished");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    int percent = (progress / (total / 100));
    logger.debug("OTA progress: " + String(percent) + "%");
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    String errorMsg = "OTA error: ";
    switch (error) {
      case OTA_AUTH_ERROR: errorMsg += "Auth failed"; break;
      case OTA_BEGIN_ERROR: errorMsg += "Begin failed"; break;
      case OTA_CONNECT_ERROR: errorMsg += "Connect failed"; break;
      case OTA_RECEIVE_ERROR: errorMsg += "Receive failed"; break;
      case OTA_END_ERROR: errorMsg += "End failed"; break;
    }
    logger.error(errorMsg);
  });
  
  // Voorkom "Invalid mbox" crash: lwIP stack moet stabiliseren vóór mDNS/OTA
  if (WiFi.status() != WL_CONNECTED) {
    logger.warn("OTA: WiFi niet verbonden, OTA uitgesteld");
    return false;
  }
  delay(2000);  // Laat TCP/IP stack volledig initialiseren
  
  ArduinoOTA.begin();
  initialized = true;
  logger.info("OTA update initialized");
  
  return true;
}

bool OTAUpdate::tryDeferredInit() {
  if (initialized) return true;
  if (password.length() == 0) return false;
  return init(password);
}

void OTAUpdate::handle() {
  if (initialized) {
    ArduinoOTA.handle();
  }
}

void OTAUpdate::setHostname(String hostname) {
  ArduinoOTA.setHostname(hostname.c_str());
}
