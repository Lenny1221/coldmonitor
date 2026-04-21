#ifndef WATCHDOG_TPL5010_H
#define WATCHDOG_TPL5010_H

#include <Arduino.h>

/**
 * Watchdog-laag voor carrier-v1.1 firmware.
 *
 * Dit module combineert TWEE onafhankelijke watchdogs:
 *
 * 1. Hardware-WDT (TPL5010 op carrier, DONE = GPIO 4)
 *    - Gedreven door een FreeRTOS-task op core 0 (10 ms ritme, 100 µs puls).
 *    - Reset de ESP32 via EN als hij niet gekickt wordt. Stand van zaken:
 *      op carrier v1.1 ziet de TPL5010 onze kicks niet (zie comment in
 *      watchdog_tpl5010.cpp) — is hardware-issue, geen firmware-bug.
 *
 * 2. Software-WDT (esp_task_wdt, MCU-interne WDT)
 *    - Vangt echte lockups van de loop-task op (deadlock, infinite loop).
 *    - Onafhankelijk van de carrier: blijft bestaan zelfs als TPL5010
 *      elders wordt bypassed.
 *    - Ruime timeout (WDT_SW_TIMEOUT_SEC) zodat hij pas ingrijpt bij
 *      échte hangs, niet bij trage NVS/WiFi-init.
 *
 * Gebruik:
 *   - initWatchdog() zo vroeg mogelijk in setup().
 *   - kickWatchdog() in de main loop én in lange blocking calls
 *     (WiFi connect, modem wake, HTTP request). Kickt BEIDE watchdogs.
 */

void initWatchdog();
void kickWatchdog();

// Diagnose-tellers (enkel voor logging).
uint32_t watchdogIsrKickCount();         // TPL5010-puls-teller (FreeRTOS-task)
uint32_t watchdogVerifiedKickCount();    // reserved, momenteel 0

#endif /* WATCHDOG_TPL5010_H */
