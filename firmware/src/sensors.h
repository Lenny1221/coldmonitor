#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Pin configuratie (ESP32)
#define PIN_DHT_DATA     27   // DHT11 DATA
#define PIN_DOOR         25   // Deurstatus: één draad naar GPIO25, andere naar GND (schakelaar ertussen)
#define I2C_SDA          21   // BMP180 I²C SDA
#define I2C_SCL          22   // BMP180 I²C SCL

// Deur: INPUT_PULLUP. Schakelaar gesloten (pin→GND) = LOW = deur dicht. Schakelaar open = HIGH = deur open.
// Als bij jou de melding verkeerd om staat: zet PIN_DOOR_INVERTED op 1.
#define PIN_DOOR_INVERTED 0   // 0 = LOW=dicht HIGH=open; 1 = omgekeerd

struct SensorData {
  float temperature;    // °C
  float humidity;       // % (0-100)
  bool doorOpen;        // true = deur open (na eventuele invert)
  bool doorPinHigh;     // ruwe GPIO (1=HIGH, 0=LOW) voor debug
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
