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

class BatteryMonitor {
private:
  float voltage;
  int percentage;
  unsigned long lastUpdate;
  unsigned long updateInterval;
  
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
