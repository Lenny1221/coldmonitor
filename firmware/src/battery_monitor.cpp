#include "battery_monitor.h"
#include "logger.h"

extern Logger logger;

BatteryMonitor::BatteryMonitor() : voltage(0.0), percentage(0), lastUpdate(0), updateInterval(1000) {
}

BatteryMonitor::~BatteryMonitor() {
}

bool BatteryMonitor::init() {
  pinMode(BATTERY_ADC_PIN, INPUT);
  analogSetAttenuation(ADC_11db); // 0-3.3V range
  update();
  logger.info("Battery monitor initialized: " + String(voltage, 2) + "V (" + String(percentage) + "%)");
  return true;
}

float BatteryMonitor::readVoltage() {
  int adcValue = analogRead(BATTERY_ADC_PIN);
  float v = (float)adcValue * BATTERY_VOLTAGE_DIVIDER_RATIO * BATTERY_VREF / 4095.0;
  return v;
}

int BatteryMonitor::calculatePercentage(float voltage) {
  if (voltage >= BATTERY_FULL_VOLTAGE) {
    return 100;
  }
  if (voltage <= BATTERY_EMPTY_VOLTAGE) {
    return 0;
  }
  
  // Linear interpolation
  float range = BATTERY_FULL_VOLTAGE - BATTERY_EMPTY_VOLTAGE;
  float level = voltage - BATTERY_EMPTY_VOLTAGE;
  int percent = (int)((level / range) * 100.0);
  
  return constrain(percent, 0, 100);
}

void BatteryMonitor::update() {
  unsigned long now = millis();
  
  if (now - lastUpdate >= updateInterval) {
    voltage = readVoltage();
    percentage = calculatePercentage(voltage);
    lastUpdate = now;
  }
}

float BatteryMonitor::getVoltage() {
  return voltage;
}

int BatteryMonitor::getPercentage() {
  return percentage;
}

bool BatteryMonitor::isLow() {
  return percentage < 20;
}

bool BatteryMonitor::isCritical() {
  return percentage < 10;
}
