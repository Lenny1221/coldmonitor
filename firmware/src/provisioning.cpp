#include "provisioning.h"
#include "logger.h"

extern Logger logger;

ProvisioningManager::ProvisioningManager() : provisioned(false) {
}

ProvisioningManager::~ProvisioningManager() {
  prefs.end();
}

String ProvisioningManager::maskSecret(const String& secret, int showLast) {
  if (secret.length() == 0) {
    return "(leeg)";
  }
  if (secret.length() <= showLast) {
    return "****";
  }
  return "****" + secret.substring(secret.length() - showLast);
}

bool ProvisioningManager::begin() {
  unsigned long startTime = millis();
  
  logger.info("========================================");
  logger.info("PROVISIONING: Initialiseren NVS...");
  
  if (!prefs.begin(PROVISION_NAMESPACE, false)) {
    logger.error("PROVISIONING: FOUT - Kan NVS namespace niet openen!");
    return false;
  }
  
  // Check provisioning state
  provisioned = prefs.getBool(KEY_PROVISIONED, false);
  
  unsigned long elapsed = millis() - startTime;
  logger.info("PROVISIONING: NVS geladen in " + String(elapsed) + "ms");
  logger.info("PROVISIONING: Status = " + String(provisioned ? "PROVISIONED" : "NIET PROVISIONED"));
  logger.info("========================================");
  
  return true;
}

bool ProvisioningManager::isProvisioned() {
  return provisioned;
}

void ProvisioningManager::setProvisioned(bool value) {
  provisioned = value;
}

bool ProvisioningManager::hasWiFiCredentials() {
  String ssid = prefs.getString(KEY_WIFI_SSID, "");
  return ssid.length() > 0;
}

String ProvisioningManager::getWiFiSSID() {
  return prefs.getString(KEY_WIFI_SSID, "");
}

String ProvisioningManager::getWiFiPassword() {
  return prefs.getString(KEY_WIFI_PASS, "");
}

bool ProvisioningManager::setWiFiCredentials(const String& ssid, const String& password) {
  if (ssid.length() == 0 || ssid.length() > MAX_SSID_LEN) {
    logger.error("PROVISIONING: Ongeldige SSID lengte: " + String(ssid.length()));
    return false;
  }
  
  if (password.length() > MAX_PASS_LEN) {
    logger.error("PROVISIONING: WiFi wachtwoord te lang: " + String(password.length()));
    return false;
  }
  
  bool success = true;
  success &= prefs.putString(KEY_WIFI_SSID, ssid) > 0;
  
  // Only save password if it's not a placeholder
  if (password != "saved_by_wifimanager") {
    success &= prefs.putString(KEY_WIFI_PASS, password) > 0;
  } else {
    // Password is saved by WiFiManager, just log it
    logger.info("PROVISIONING: WiFi password wordt beheerd door WiFiManager");
  }
  
  if (success) {
    logger.info("PROVISIONING: WiFi credentials opgeslagen");
    logger.info("  SSID: " + ssid);
    if (password != "saved_by_wifimanager") {
      logger.info("  Pass: " + maskSecret(password));
    } else {
      logger.info("  Pass: (beheerd door WiFiManager)");
    }
  } else {
    logger.error("PROVISIONING: FOUT bij opslaan WiFi credentials!");
  }
  
  return success;
}

bool ProvisioningManager::hasAPICredentials() {
  String url = prefs.getString(KEY_API_URL, "");
  String key = prefs.getString(KEY_API_KEY, "");
  return url.length() > 0 && key.length() > 0;
}

String ProvisioningManager::getAPIUrl() {
  return prefs.getString(KEY_API_URL, "");
}

String ProvisioningManager::getAPIKey() {
  return prefs.getString(KEY_API_KEY, "");
}

bool ProvisioningManager::setAPICredentials(const String& url, const String& key) {
  if (url.length() == 0 || url.length() > MAX_API_URL_LEN) {
    logger.error("PROVISIONING: Ongeldige API URL lengte: " + String(url.length()));
    return false;
  }
  
  if (key.length() == 0 || key.length() > MAX_API_KEY_LEN) {
    logger.error("PROVISIONING: Ongeldige API Key lengte: " + String(key.length()));
    return false;
  }
  
  bool success = true;
  success &= prefs.putString(KEY_API_URL, url) > 0;
  success &= prefs.putString(KEY_API_KEY, key) > 0;
  
  if (success) {
    logger.info("PROVISIONING: API credentials opgeslagen");
    logger.info("  URL: " + url);
    logger.info("  Key: " + maskSecret(key));
  } else {
    logger.error("PROVISIONING: FOUT bij opslaan API credentials!");
  }
  
  return success;
}

bool ProvisioningManager::save() {
  // Mark as provisioned if we have both WiFi and API credentials
  bool hasWiFi = hasWiFiCredentials();
  bool hasAPI = hasAPICredentials();
  
  if (hasWiFi && hasAPI) {
    provisioned = true;
    if (prefs.putBool(KEY_PROVISIONED, true)) {
      logger.info("PROVISIONING: Status opgeslagen als PROVISIONED");
      return true;
    } else {
      logger.error("PROVISIONING: FOUT bij opslaan provisioning status!");
      return false;
    }
  } else {
    logger.warn("PROVISIONING: Kan niet als PROVISIONED markeren:");
    logger.warn("  WiFi credentials: " + String(hasWiFi ? "JA" : "NEE"));
    logger.warn("  API credentials: " + String(hasAPI ? "JA" : "NEE"));
    return false;
  }
}

bool ProvisioningManager::factoryReset() {
  logger.warn("========================================");
  logger.warn("FACTORY RESET: Wissen van alle instellingen...");
  
  bool success = true;
  
  // Remove all keys
  success &= prefs.remove(KEY_WIFI_SSID);
  success &= prefs.remove(KEY_WIFI_PASS);
  success &= prefs.remove(KEY_API_URL);
  success &= prefs.remove(KEY_API_KEY);
  success &= prefs.remove(KEY_PROVISIONED);
  
  // Also clear WiFiManager settings if namespace exists
  Preferences wmPrefs;
  if (wmPrefs.begin("wm", false)) {
    wmPrefs.clear();
    wmPrefs.end();
  }
  
  provisioned = false;
  
  if (success) {
    logger.warn("FACTORY RESET: Alle instellingen gewist");
    logger.warn("FACTORY RESET: Device zal opnieuw config portal starten");
  } else {
    logger.error("FACTORY RESET: FOUT bij wissen instellingen!");
  }
  
  logger.warn("========================================");
  
  return success;
}

void ProvisioningManager::logBootReason() {
  esp_reset_reason_t reason = esp_reset_reason();
  const char* reasonStr = "ONBEKEND";
  
  switch (reason) {
    case ESP_RST_POWERON: reasonStr = "POWERON"; break;
    case ESP_RST_EXT: reasonStr = "EXTERNAL_RESET"; break;
    case ESP_RST_SW: reasonStr = "SOFTWARE_RESET"; break;
    case ESP_RST_PANIC: reasonStr = "PANIC/CRASH"; break;
    case ESP_RST_INT_WDT: reasonStr = "INTERRUPT_WDT"; break;
    case ESP_RST_TASK_WDT: reasonStr = "TASK_WDT"; break;
    case ESP_RST_WDT: reasonStr = "WDT"; break;
    case ESP_RST_DEEPSLEEP: reasonStr = "DEEPSLEEP"; break;
    case ESP_RST_BROWNOUT: reasonStr = "BROWNOUT"; break;
    case ESP_RST_SDIO: reasonStr = "SDIO"; break;
    default: reasonStr = "ONBEKEND"; break;
  }
  
  logger.info("BOOT: Reset reden = " + String(reasonStr) + " (code: " + String(reason) + ")");
}

void ProvisioningManager::logProvisioningState() {
  logger.info("========================================");
  logger.info("PROVISIONING STATUS:");
  logger.info("  Provisioned: " + String(provisioned ? "JA" : "NEE"));
  logger.info("  WiFi credentials: " + String(hasWiFiCredentials() ? "JA" : "NEE"));
  logger.info("  API credentials: " + String(hasAPICredentials() ? "JA" : "NEE"));
  logger.info("========================================");
}

void ProvisioningManager::logWiFiState() {
  if (hasWiFiCredentials()) {
    String ssid = getWiFiSSID();
    logger.info("WIFI: Opgeslagen SSID = " + ssid);
    logger.info("WIFI: Password = " + maskSecret(getWiFiPassword()));
  } else {
    logger.warn("WIFI: Geen opgeslagen WiFi credentials gevonden");
  }
}

void ProvisioningManager::logAPIState() {
  if (hasAPICredentials()) {
    String url = getAPIUrl();
    String key = getAPIKey();
    logger.info("API: URL = " + url);
    logger.info("API: Key = " + maskSecret(key));
  } else {
    logger.warn("API: Geen opgeslagen API credentials gevonden");
  }
}
