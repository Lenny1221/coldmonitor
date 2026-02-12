#ifndef PROVISIONING_H
#define PROVISIONING_H

#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>

/**
 * PROVISIONING MANAGER
 * 
 * Production-grade provisioning system voor ESP32 met persistente NVS opslag.
 * 
 * FEATURES:
 * - First-boot detectie
 * - Persistente WiFi credentials opslag
 * - API URL en Key opslag
 * - Factory reset functionaliteit
 * - Security: maskeert secrets in logs
 * 
 * NVS STRUCTURE:
 * Namespace: "provision"
 * Keys:
 *   - wifi_ssid: WiFi SSID
 *   - wifi_pass: WiFi password
 *   - api_url: Backend API URL
 *   - api_key: API authentication key
 *   - provisioned: Boolean flag (0/1)
 * 
 * RESET KNOOP:
 * - GPIO 0 (BOOT button) - 3 seconden ingedrukt = factory reset
 * - Of gebruik dedicated GPIO pin (configureerbaar)
 */

#define PROVISION_NAMESPACE "provision"
#define KEY_WIFI_SSID "wifi_ssid"
#define KEY_WIFI_PASS "wifi_pass"
#define KEY_API_URL "api_url"
#define KEY_API_KEY "api_key"
#define KEY_PROVISIONED "provisioned"

#define MAX_SSID_LEN 32
#define MAX_PASS_LEN 64
#define MAX_API_URL_LEN 256
#define MAX_API_KEY_LEN 128

class ProvisioningManager {
private:
  Preferences prefs;
  bool provisioned;
  
  // Mask secret values for logging (show only last 4 chars)
  String maskSecret(const String& secret, int showLast = 4);
  
public:
  ProvisioningManager();
  ~ProvisioningManager();
  
  // Initialize and load settings
  bool begin();
  
  // Provisioning state
  bool isProvisioned();
  void setProvisioned(bool value);
  
  // WiFi credentials
  bool hasWiFiCredentials();
  String getWiFiSSID();
  String getWiFiPassword();
  bool setWiFiCredentials(const String& ssid, const String& password);
  
  // API settings
  bool hasAPICredentials();
  String getAPIUrl();
  String getAPIKey();
  bool setAPICredentials(const String& url, const String& key);
  
  // Save all settings to NVS
  bool save();
  
  // Factory reset - wipe all settings
  bool factoryReset();
  
  // Logging helpers
  void logBootReason();
  void logProvisioningState();
  void logWiFiState();
  void logAPIState();
};

#endif
