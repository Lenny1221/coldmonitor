#ifndef SENSORS_PT1000_H
#define SENSORS_PT1000_H

#include <Arduino.h>

/**
 * Twee MAX31865 (PT1000, 2-wire) op gedeelde SPI. CS-pinnen uit pins_carrier.h.
 * RREF = 4020Ω (carrier v1), RNOMINAL = 1000Ω, 50Hz notch-filter.
 */

#define PT1000_COUNT          2
#define PT1000_RREF_OHM       4020.0f
#define PT1000_RNOMINAL_OHM   1000.0f

/** Init beide sensoren. Returnt true als minstens één OK is. */
bool initSensors();

/** Temperatuur in °C voor idx=0 of 1. NAN bij fault of init-fail. */
float readSensor(uint8_t idx);

/** MAX31865-faultcode (0 = ok). Roept readFault() aan en wist daarna. */
uint8_t sensorFault(uint8_t idx);

/** True als sensor tijdens init OK was én laatste read geldig was. */
bool sensorOk(uint8_t idx);

#endif /* SENSORS_PT1000_H */
