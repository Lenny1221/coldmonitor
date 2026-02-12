#include "boot_state.h"

const char* bootStateToString(BootState s) {
  switch (s) {
    case STATE_BOOT:           return "BOOT";
    case STATE_LOAD_NVS:       return "LOAD_NVS";
    case STATE_WIFI_CONNECT:   return "WIFI_CONNECT";
    case STATE_CONFIG_PORTAL:  return "CONFIG_PORTAL";
    case STATE_API_HANDSHAKE:  return "API_HANDSHAKE";
    case STATE_RUN:            return "RUN";
    default:                   return "UNKNOWN";
  }
}
