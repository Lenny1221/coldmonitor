#include "power_monitor.h"
#include "logger.h"

extern Logger logger;

PowerMonitor::PowerMonitor() : usbConnected(false), usbVoltage(0.0), lastUpdate(0), updateInterval(500) {
}

PowerMonitor::~PowerMonitor() {
}

bool PowerMonitor::init() {
#if USB_ADC_PIN == 255
  logger.info("Power monitor: uit (geen USB-ADC pin op dit board)");
  usbConnected = false;
  return true;
#else
  pinMode(USB_ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db);  // 0-3.3V range
  update();
  logger.info(String("Power monitor initialized: USB ") + (usbConnected ? "aangesloten" : "los") +
              " (GPIO" + String(USB_ADC_PIN) + "=" + String(usbVoltage, 2) + "V)");
  return true;
#endif
}

float PowerMonitor::readUsbVoltage() {
#if USB_ADC_PIN == 255
  return 0.0f;
#else
  return analogReadMilliVolts(USB_ADC_PIN) / 1000.0f;
#endif
}

void PowerMonitor::update() {
#if USB_ADC_PIN == 255
  (void)lastUpdate;
  return;
#else
  unsigned long now = millis();
  if (now - lastUpdate >= updateInterval) {
    usbVoltage = readUsbVoltage();
    bool wasConnected = usbConnected;
    if (usbConnected) {
      usbConnected = (usbVoltage >= USB_DISCONNECTED_THRESHOLD_V);
    } else {
      usbConnected = (usbVoltage >= USB_CONNECTED_THRESHOLD_V);
    }
    lastUpdate = now;
    if (usbConnected != wasConnected) {
      logger.info(String("USB ") + (usbConnected ? "aangesloten" : "losgetrokken") +
                  " (GPIO" + String(USB_ADC_PIN) + "=" + String(usbVoltage, 2) + "V)");
    }
  }
#endif
}

bool PowerMonitor::isUsbConnected() {
  return usbConnected;
}

float PowerMonitor::getUsbVoltage() {
  return usbVoltage;
}
