#include "power_manager.h"
#include "logger.h"
#include <esp_sleep.h>

extern Logger logger;

PowerManager::PowerManager() : initialized(false) {
}

PowerManager::~PowerManager() {
}

bool PowerManager::init() {
  initialized = true;
  logger.info("Power manager initialized");
  return true;
}

void PowerManager::enterDeepSleep(unsigned long seconds) {
  logger.info("Entering deep sleep for " + String(seconds) + " seconds");
  
  // Configure wake-up source (timer)
  esp_sleep_enable_timer_wakeup(seconds * 1000000ULL); // Convert to microseconds
  
  // Enter deep sleep
  esp_deep_sleep_start();
}

void PowerManager::lightSleep(unsigned long milliseconds) {
  // Light sleep (keeps WiFi connection)
  esp_sleep_enable_timer_wakeup(milliseconds * 1000ULL);
  esp_light_sleep_start();
}

void PowerManager::setCPUFrequency(uint8_t frequency) {
  // Set CPU frequency (80, 160, 240 MHz)
  setCpuFrequencyMhz(frequency);
  logger.info("CPU frequency set to " + String(frequency) + " MHz");
}

void PowerManager::enableWiFiPowerSave(bool enable) {
  // Enable/disable WiFi power save mode
  WiFi.setSleep(enable);
  logger.info("WiFi power save: " + String(enable ? "enabled" : "disabled"));
}
