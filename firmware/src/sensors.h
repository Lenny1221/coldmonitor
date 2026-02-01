#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Pin configuratie (ESP32)
#define PIN_DHT_DATA     27   // DHT11 DATA
#define PIN_DOOR         25   // Deurstatus: NO/NC contact, COM→GND
#define I2C_SDA          21   // BMP180 I²C
#define I2C_SCL          22   // BMP180 I²C

// Deurstatus: INPUT_PULLUP, contact gesloten→LOW, contact open→HIGH
// doorOpen = true als GPIO HIGH (contact open = deur open)

struct SensorData {
  float temperature;    // °C
  float humidity;       // % (0-100)
  bool doorOpen;        // true = deur open
  float pressure;       // hPa (van BMP180, optioneel)
  bool valid;           // Minimaal temperatuur geldig
};

class Sensors {
public:
  Sensors();
  bool init();
  SensorData read();
  
private:
  bool bmpReady;
  bool dhtReady;
};

#endif
