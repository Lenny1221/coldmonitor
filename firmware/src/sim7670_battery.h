#ifndef SIM7670_BATTERY_H
#define SIM7670_BATTERY_H

#include <Arduino.h>

/**
 * SIM7670G batterijspanning via AT+CBC
 * =========================================================================
 * Op de carrier v1.1 hangen er twee dingen aan ESP32 GPIO 4: de LilyGO
 * BAT_ADC-deler én WAKE_GPIO van de TPL5010-watchdog. Die twee samen maken
 * GPIO 4 onbruikbaar als ADC-input voor batterij-monitoring (de TPL5010
 * drijft de pin actief). Daarom doen we batterij-monitoring software-only:
 * we vragen de SIM7670G modem zelf zijn VBAT-spanning via AT+CBC.
 *
 * Ruwweg:
 *   1. setup()  -> sim7670::init()    : pulse PWRKEY, start UART2, mark BOOTING
 *   2. periodiek -> sim7670::update() : non-blocking state machine. Probe AT
 *                                       tot OK -> READY. Daarna AT+CBC elke 30 s.
 *   3. main loop -> sim7670::isReady()/getVoltageMv()/getPercentage()
 *
 * Pinout (LilyGO T-SIM7670G S3, intern; niet op carrier-headers):
 *   PWRKEY = GPIO 18
 *   DTR    = GPIO  9
 *   TX     = GPIO 11   (ESP32 -> modem)
 *   RX     = GPIO 10   (modem -> ESP32)
 * UART2 wordt gebruikt; UART1 is RS485, UART0 is USB-CDC.
 */
namespace sim7670 {

void init();          // call once in setup() na watchdog-init
void update();        // call regelmatig (>1 Hz). Self-throttle binnenin.
bool isReady();       // true zodra de modem antwoordde + we een geldige meting hebben
int  getVoltageMv();  // laatste batterijspanning in mV, -1 indien onbekend
int  getPercentage(); // 0..100 op basis van Li-Ion lineaire mapping, -1 indien onbekend

} // namespace sim7670

#endif /* SIM7670_BATTERY_H */
