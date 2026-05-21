#ifndef SENSORS_PT1000_H
#define SENSORS_PT1000_H

#include <Arduino.h>

/**
 * Twee MAX31865 (PT1000, 2-wire, ATP+T package) op gedeelde SPI.
 * CS-pinnen uit pins_carrier.h.
 * RREF = 4020Ω (carrier v1.1), RNOMINAL = 1000Ω, 50Hz notch-filter.
 *
 * Rolverdeling op carrier v1.1 (fysieke screw-terminals):
 *   idx 0 (CS1, PT1000_1) → RUIMTE-voeler (koelcel-ambient)
 *                            → primaire temperatuur, HACCP-alarmen
 *   idx 1 (CS2, PT1000_2) → VERDAMPER-voeler (evaporator-coil)
 *                            → diagnose, defrost-logica, ijsvorming
 */

#define PT1000_COUNT          2
#define PT1000_RREF_OHM       4020.0f
#define PT1000_RNOMINAL_OHM   1000.0f

#define PT1000_IDX_ROOM        0
#define PT1000_IDX_EVAPORATOR  1

/** Init beide sensoren. Returnt true als minstens één OK is. */
bool initSensors();

/** Temperatuur in °C voor idx=0 of 1. NAN bij fault of init-fail. */
float readSensor(uint8_t idx);

/** MAX31865-faultcode (0 = ok). Roept readFault() aan en wist daarna. */
uint8_t sensorFault(uint8_t idx);

/** True als sensor tijdens init OK was én laatste read geldig was. */
bool sensorOk(uint8_t idx);

/* ---- Semantische aliassen (zelfde onderliggende chips, leesbaarder) ---- */
inline float   readRoomTempC()       { return readSensor(PT1000_IDX_ROOM); }
inline float   readEvaporatorTempC() { return readSensor(PT1000_IDX_EVAPORATOR); }
inline uint8_t roomSensorFault()     { return sensorFault(PT1000_IDX_ROOM); }
inline uint8_t evaporatorFault()     { return sensorFault(PT1000_IDX_EVAPORATOR); }
inline bool    roomSensorOk()        { return sensorOk(PT1000_IDX_ROOM); }
inline bool    evaporatorSensorOk()  { return sensorOk(PT1000_IDX_EVAPORATOR); }

/** Laatste geldige meting (geen SPI) — veilig tijdens HTTP/WiFi op andere taken. */
float   getCachedTempC(uint8_t idx);
uint8_t getCachedFault(uint8_t idx);

#endif /* SENSORS_PT1000_H */
