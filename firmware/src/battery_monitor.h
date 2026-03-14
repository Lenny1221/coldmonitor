#ifndef BATTERY_MONITOR_H
#define BATTERY_MONITOR_H

#include <Arduino.h>

// Battery monitoring using ADC
// Assumes voltage divider: Battery -> R1 -> ADC -> R2 -> GND
// Formula: V_battery = ADC_value * (R1 + R2) / R2 * V_ref / 4095

#define BATTERY_ADC_PIN 34
#define BATTERY_VOLTAGE_DIVIDER_RATIO 2.0  // (R1 + R2) / R2
#define BATTERY_VREF 3.3
#define BATTERY_FULL_VOLTAGE 4.2
#define BATTERY_EMPTY_VOLTAGE 3.0
#define BATTERY_SMOOTH_ALPHA 0.2f      // Exponentieel gemiddelde: 20% nieuw, 80% oud
#define BATTERY_MAX_PCT_CHANGE 3      // Max %-punt verandering per seconde (stabiliseert bij USB in/uit)
#define BATTERY_CALIBRATION_FACTOR 1.084f  // Compenseer ADC-afwijking (4.01V echt vs 3.7V gelezen)

class BatteryMonitor {
private:
  float voltage;
  int percentage;
  unsigned long lastUpdate;
  unsigned long updateInterval;
  bool voltageInitialized;
  
  float readVoltage();
  int calculatePercentage(float voltage);
  
public:
  BatteryMonitor();
  ~BatteryMonitor();
  
  bool init();
  void update();
  float getVoltage();
  int getPercentage();
  bool isLow();
  bool isCritical();
};

#endif
