#ifndef POWER_MONITOR_H
#define POWER_MONITOR_H

#include <Arduino.h>
#include "board_pins.h"
#include "pins_carrier.h"

/*
 * PowerMonitor op de carrier-PCB v1.1:
 *   - Digitale VBUS_DETECT ingang (PIN_VBUS_DETECT = GPIO 12), actief-hoog
 *     via BAT54 + weerstandsdeler. Geen ADC meer.
 *   - Op niet-carrier builds (BOARD_POWER_MONITOR_DISABLED niet gezet, maar
 *     BOARD_USB_ADC_PIN wél) valt PowerMonitor terug op de klassieke
 *     ADC-meting.
 */

#if defined(BOARD_POWER_MONITOR_DISABLED) && defined(PIN_VBUS_DETECT)
#define POWER_MONITOR_USES_VBUS_DIGITAL 1
#define USB_ADC_PIN PIN_VBUS_DETECT
#elif defined(BOARD_POWER_MONITOR_DISABLED)
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
