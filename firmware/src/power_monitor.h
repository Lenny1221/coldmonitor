#ifndef POWER_MONITOR_H
#define POWER_MONITOR_H

#include <Arduino.h>
#include "board_pins.h"

// Externe voeding via ADC (DevKit: GPIO 35 = USB-sense; LilyGO: GPIO 5 = VIN/solar, geen USB-kabelsensor).
#if defined(BOARD_POWER_MONITOR_DISABLED)
#define USB_ADC_PIN 255
#elif defined(BOARD_USB_ADC_PIN)
#define USB_ADC_PIN BOARD_USB_ADC_PIN
#else
#define USB_ADC_PIN 35
#endif

#ifndef USB_CONNECTED_THRESHOLD_V
#define USB_CONNECTED_THRESHOLD_V 2.0f
#endif
#ifndef USB_DISCONNECTED_THRESHOLD_V
#define USB_DISCONNECTED_THRESHOLD_V 0.5f
#endif
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
