#ifndef RELAY_CONTROL_H
#define RELAY_CONTROL_H

#include <Arduino.h>

/**
 * HFD4/5-SR SPDT via BC817. HIGH op PIN_RELAY → transistor aan → coil onder
 * spanning → NO-contact sluit. Fly-back 1N4148 beschermt de transistor.
 *
 * Boot-state: relais uit. Nooit auto-energizen.
 */

void initRelay();
void setRelay(bool on);
bool getRelayState();

#endif /* RELAY_CONTROL_H */
