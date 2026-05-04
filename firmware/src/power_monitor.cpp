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

#if defined(POWER_MONITOR_USES_VBUS_DIGITAL)

// Opmerking: ondanks de naam "DIGITAL" gebruiken we hier toch de ADC. De
// hardware-deler op de carrier (R17=100k / R18=56k + BAT54-drop) levert
// slechts ~1.69 V op GPIO 1 wanneer USB-C aangesloten is. Dat valt onder
// V_IH (~2.475 V) van de ESP32-S3, dus digitalRead() leest het altijd als
// LOW. analogReadMilliVolts() ziet de werkelijke spanning en kan met een
// drempel rond 700 mV betrouwbaar onderscheid maken tussen 0 V (USB weg)
// en 1.69 V (USB aanwezig).
namespace {
constexpr int VBUS_THRESHOLD_MV = 700;
}

bool PowerMonitor::init() {
  pinMode(USB_ADC_PIN, INPUT);  // BAT54 + deler rijdt de pin
  analogSetPinAttenuation(USB_ADC_PIN, ADC_11db);
  update();
  int mv = (int)(usbVoltage * 1000.0f);
  logger.info(String("Power monitor: ") + BOARD_POWER_MONITOR_LOG_NAME +
              " (GPIO" + String(USB_ADC_PIN) + " adc=" + mv + "mV " +
              (usbConnected ? "USB aanwezig" : "USB weg") + ")");
  return true;
}

float PowerMonitor::readUsbVoltage() {
  return (float)analogReadMilliVolts(USB_ADC_PIN) / 1000.0f;
}

void PowerMonitor::update() {
  unsigned long now = millis();
  if (now - lastUpdate < updateInterval) return;
  lastUpdate = now;

  int mv     = analogReadMilliVolts(USB_ADC_PIN);
  bool level = (mv >= VBUS_THRESHOLD_MV);
  // Bewust GEEN `level || tud_mounted()` meer:
  //   - tud_mounted() is true zodra de LilyGO-USB-C in een host (jouw laptop)
  //     zit, ongeacht of de carrier-USB-C 5 V krijgt.
  //   - Voor de carrier v1.1 is "netvoeding" gedefinieerd als 5 V op de
  //     carrier-USB-C-connector (GPIO 1 ADC). Dat is precies wat we hier
  //     willen meten en doorgeven aan de backend.
  if (level != usbConnected) {
    usbConnected = level;
    logger.info(String(BOARD_POWER_MONITOR_LOG_NAME) +
                (usbConnected ? ": aangesloten" : ": weg / niet gedetecteerd") +
                " (GPIO" + String(USB_ADC_PIN) + " adc=" + mv + "mV)");
  } else {
    usbConnected = level;
  }
  usbVoltage = (float)mv / 1000.0f;
}

#else  /* Klassieke ADC-gebaseerde detectie */

bool PowerMonitor::init() {
#if USB_ADC_PIN == 255
  logger.info("Power monitor: uit (geen voedings-ADC pin op dit board)");
  usbConnected = false;
  return true;
#else
  pinMode(USB_ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db);
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

#endif /* POWER_MONITOR_USES_VBUS_DIGITAL */

bool PowerMonitor::isUsbConnected() {
  return usbConnected;
}

float PowerMonitor::getUsbVoltage() {
  return usbVoltage;
}
