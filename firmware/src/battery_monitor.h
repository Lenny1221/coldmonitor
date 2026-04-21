#ifndef BATTERY_MONITOR_H
#define BATTERY_MONITOR_H

#include <Arduino.h>
#include "board_pins.h"

// Battery monitoring using ADC (voltage divider: Battery -> R1 -> ADC -> R2 -> GND).
// Op de carrier-PCB v1.1 is GPIO 4 hertoegewezen aan WDT_DONE (TPL5010), dus
// BOARD_BATTERY_MONITOR_DISABLED is gezet en deze klasse draait als no-op.
#if defined(BOARD_BATTERY_MONITOR_DISABLED)
#define BATTERY_ADC_PIN 255
#else
#define BATTERY_ADC_PIN BOARD_BATTERY_ADC_PIN
#endif
#define BATTERY_VOLTAGE_DIVIDER_RATIO 2.0  // (R1 + R2) / R2
#define BATTERY_VREF 3.3
#define BATTERY_FULL_VOLTAGE 4.65f   // Spanning bij 100% (opgeladen via USB: ~4.65–4.67V)
#define BATTERY_EMPTY_VOLTAGE 3.0f   // Spanning bij 0% (leeg)
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
  /** Gemiddelde spanning op ADC-ingang (mV vóór ×2 deler). */
  uint32_t lastRawAdcMilliVolts;
  
  float readVoltage();
  int calculatePercentage(float voltage);
  
public:
  BatteryMonitor();
  ~BatteryMonitor();
  
  bool init();
  void update();
  float getVoltage();
  int getPercentage();
  uint32_t getLastRawAdcMilliVolts() const { return lastRawAdcMilliVolts; }
  bool isLow();
  bool isCritical();
};

#endif
