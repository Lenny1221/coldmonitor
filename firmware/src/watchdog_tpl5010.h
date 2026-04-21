#ifndef WATCHDOG_TPL5010_H
#define WATCHDOG_TPL5010_H

#include <Arduino.h>

/**
 * TPL5010: externe hardware-watchdog. DONE-pin moet minstens elke ~25 s
 * HIGH-puls krijgen (datasheet typ. 30 s timeout). Doen we dit niet, dan
 * trekt de TPL5010 z'n RSTn laag en reset hij de ESP32.
 *
 * Gebruik:
 *   - initWatchdog() in setup(), zo vroeg mogelijk.
 *   - kickWatchdog() in de main loop én in lange blocking calls
 *     (WiFi connect, modem wake, HTTP request).
 */

void initWatchdog();
void kickWatchdog();

#endif /* WATCHDOG_TPL5010_H */
