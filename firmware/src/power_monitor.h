#ifndef POWER_MONITOR_H
#define POWER_MONITOR_H

#include <Arduino.h>

// USB detection via voltage divider on GPIO 35
// 22k + 32k from USB 5V: ~2.96V when USB connected, ~0V when disconnected
#define USB_ADC_PIN 35
#define USB_CONNECTED_THRESHOLD_V 2.0   // Above this = USB connected
#define USB_DISCONNECTED_THRESHOLD_V 0.5 // Below this = USB disconnected
#define USB_VREF 3.3

class PowerMonitor {
private:
  bool usbConnected;
  float usbVoltage;
  unsigned long lastUpdate;
  unsigned long updateInterval;

  float readUsbVoltage();

public:
  PowerMonitor();
  ~PowerMonitor();

  bool init();
  void update();
  bool isUsbConnected();
  float getUsbVoltage();
};

#endif
