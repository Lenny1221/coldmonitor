#include "sensors.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP085_U.h>
#include <DHT.h>
#include <DHT_U.h>

Adafruit_BMP085_Unified bmp = Adafruit_BMP085_Unified(10085);
DHT_Unified dht(PIN_DHT_DATA, DHT11);

Sensors::Sensors() : bmpReady(false), dhtReady(false) {
}

bool Sensors::init() {
  // I²C voor BMP180 (SDA=21, SCL=22)
  Wire.begin(I2C_SDA, I2C_SCL);
  
  if (bmp.begin()) {
    bmpReady = true;
    sensor_t sensor;
    bmp.getSensor(&sensor);
  }

  dht.begin();
  sensor_t sensor;
  dht.temperature().getSensor(&sensor);
  dht.humidity().getSensor(&sensor);
  dhtReady = true;

  // Deurstatus: pull-up, contact open = HIGH = deur open
  pinMode(PIN_DOOR, INPUT_PULLUP);

  return bmpReady || dhtReady;
}

SensorData Sensors::read() {
  SensorData data = {0, 0, false, false, 0, false};

  // Temperatuur + luchtvochtigheid (DHT11 primair)
  if (dhtReady) {
    sensors_event_t event;
    if (dht.temperature().getEvent(&event) && !isnan(event.temperature)) {
      data.temperature = event.temperature;
      data.valid = true;
    }
    if (dht.humidity().getEvent(&event) && !isnan(event.relative_humidity)) {
      data.humidity = event.relative_humidity;
    }
  }

  // Fallback temperatuur + luchtdruk van BMP180 als DHT11 faalt
  if (bmpReady) {
    float temp, press;
    bmp.getTemperature(&temp);
    bmp.getPressure(&press);
    if (!isnan(temp) && temp > -40 && temp < 85) {
      if (!data.valid) {
        data.temperature = temp;
        data.valid = true;
      }
    }
    if (!isnan(press) && press > 0) {
      data.pressure = press;
    }
  }

  // Deurstatus: raw pin; dan al dan niet inverteren
  data.doorPinHigh = (digitalRead(PIN_DOOR) == HIGH);
  data.doorOpen = PIN_DOOR_INVERTED ? !data.doorPinHigh : data.doorPinHigh;

  return data;
}
