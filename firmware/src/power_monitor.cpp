#include "power_monitor.h"
#include "logger.h"

#if defined(BOARD_LILYGO_T_SIM7670G_S3) && defined(CONFIG_IDF_TARGET_ESP32S3) && defined(ARDUINO_USB_CDC_ON_BOOT) && defined(CONFIG_TINYUSB_ENABLED)
#include "tusb.h"
#define POWER_MONITOR_USB_CDC_SUPPLEMENT 1
#endif

extern Logger logger;

PowerMonitor::PowerMonitor() : usbConnected(false), usbVoltage(0.0), lastUpdate(0), updateInterval(500) {
}

PowerMonitor::~PowerMonitor() {
}

bool PowerMonitor::init() {
#if USB_ADC_PIN == 255
  logger.info("Power monitor: uit (geen voedings-ADC pin op dit board)");
  usbConnected = false;
  return true;
#else
  pinMode(USB_ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db);  // 0-3.3V range
  analogReadResolution(12);
  update();
  logger.info(String("Power monitor initialized: ") + BOARD_POWER_MONITOR_LOG_NAME +
              (usbConnected ? " aangesloten" : " niet gedetecteerd") +
              " (GPIO" + String(USB_ADC_PIN) + "=" + String(usbVoltage, 2) + "V)");
  return true;
#endif
}

float PowerMonitor::readUsbVoltage() {
#if USB_ADC_PIN == 255
  return 0.0f;
#else
  uint32_t sumMv = 0;
  for (int i = 0; i < 9; i++) {
    sumMv += analogReadMilliVolts(USB_ADC_PIN);
    delayMicroseconds(120);
  }
  return (float)sumMv / 9.0f / 1000.0f;
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
#if defined(POWER_MONITOR_USB_CDC_SUPPLEMENT)
    bool cdcUp = tud_mounted();
#else
    bool cdcUp = false;
#endif
    if (usbConnected) {
      usbConnected = (usbVoltage >= USB_DISCONNECTED_THRESHOLD_V) || cdcUp;
    } else {
      usbConnected = (usbVoltage >= USB_CONNECTED_THRESHOLD_V) || cdcUp;
    }
    lastUpdate = now;
    if (usbConnected != wasConnected) {
      logger.info(String(BOARD_POWER_MONITOR_LOG_NAME) +
                  (usbConnected ? ": aangesloten" : ": weg / niet gedetecteerd") +
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
