#ifndef VBUS_EXTERNAL_H
#define VBUS_EXTERNAL_H

#include <Arduino.h>

/**
 * Onafhankelijk VBUS-detectiesignaal op de carrier (BAT54 + R-deler).
 * HIGH wanneer externe 12-24 V DC op de schroefterminal aanwezig is, of
 * wanneer USB-C stroom voert.
 *
 * Bewust LOS van power_monitor (dat kijkt naar GPIO12 charge-LED +
 * GPIO4 battery-ADC). Gedraagt zich als pure getter; wijzigt geen
 * bestaande USB-logica.
 */

void initExternalPowerSense();
bool isExternalPowerPresent();

#endif /* VBUS_EXTERNAL_H */
