#ifndef BOOT_STATE_H
#define BOOT_STATE_H

#include <Arduino.h>

/**
 * Boot state machine voor ColdMonitor ESP32
 * BOOT -> LOAD_NVS -> WIFI_CONNECT -> API_HANDSHAKE -> RUN
 */
enum BootState {
  STATE_BOOT,
  STATE_LOAD_NVS,
  STATE_WIFI_CONNECT,
  STATE_CONFIG_PORTAL,
  STATE_API_HANDSHAKE,
  STATE_RUN
};

/**
 * Status voor app/server: connected_to_wifi, connected_to_api, last_error
 */
struct DeviceStatus {
  bool connectedToWifi;
  bool connectedToApi;
  String lastError;
  unsigned long lastHeartbeat;
  unsigned long uptimeMs;
};

const char* bootStateToString(BootState s);

#endif
