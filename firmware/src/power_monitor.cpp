#include "power_monitor.h"
#include "logger.h"

extern Logger logger;

PowerMonitor::PowerMonitor() : usbConnected(false), usbVoltage(0.0), lastUpdate(0), updateInterval(500) {
}

PowerMonitor::~PowerMonitor() {
}

bool PowerMonitor::init() {
  pinMode(USB_ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db);  // 0-3.3V range
  update();
  logger.info(String("Power monitor initialized: USB ") + (usbConnected ? "aangesloten" : "los") +
              " (GPIO35=" + String(usbVoltage, 2) + "V)");
  return true;
}

float PowerMonitor::readUsbVoltage() {
  int adcValue = analogRead(USB_ADC_PIN);
  float v = (float)adcValue * USB_VREF / 4095.0;
  return v;
}

void PowerMonitor::update() {
  unsigned long now = millis();
  if (now - lastUpdate >= updateInterval) {
    usbVoltage = readUsbVoltage();
    bool wasConnected = usbConnected;
    usbConnected = (usbVoltage >= USB_CONNECTED_THRESHOLD_V);
    lastUpdate = now;
    if (usbConnected != wasConnected) {
      logger.info(String("USB ") + (usbConnected ? "aangesloten" : "losgetrokken") + " (GPIO35=" + String(usbVoltage, 2) + "V)");
    }
  }
}

bool PowerMonitor::isUsbConnected() {
  return usbConnected;
}

float PowerMonitor::getUsbVoltage() {
  return usbVoltage;
}
