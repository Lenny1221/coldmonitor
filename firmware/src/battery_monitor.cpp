#include "battery_monitor.h"
#include "logger.h"

extern Logger logger;

BatteryMonitor::BatteryMonitor() : voltage(0.0), percentage(0), lastUpdate(0), updateInterval(1000), voltageInitialized(false) {
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
  // Gemiddelde van 5 metingen om ADC-ruis te verminderen
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(BATTERY_ADC_PIN);
    delay(2);
  }
  int adcValue = sum / 5;
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
    float rawVoltage = readVoltage();
    
    // Exponentieel gemiddelde voor spanning (smooth bij USB in/uit)
    if (!voltageInitialized) {
      voltage = rawVoltage;
      voltageInitialized = true;
    } else {
      voltage = voltage * (1.0f - BATTERY_SMOOTH_ALPHA) + rawVoltage * BATTERY_SMOOTH_ALPHA;
    }
    voltage *= BATTERY_CALIBRATION_FACTOR;  // Compenseer ADC-afwijking
    
    int rawPercent = calculatePercentage(voltage);
    // Bij 100% (opgeladen): direct tonen, geen rate limit
    if (rawPercent >= 100) {
      percentage = 100;
    } else {
      // Rate limit: max BATTERY_MAX_PCT_CHANGE per seconde (voorkomt sprongen bij USB in/uit)
      int delta = rawPercent - percentage;
      if (delta > BATTERY_MAX_PCT_CHANGE) delta = BATTERY_MAX_PCT_CHANGE;
      if (delta < -BATTERY_MAX_PCT_CHANGE) delta = -BATTERY_MAX_PCT_CHANGE;
      percentage = constrain(percentage + delta, 0, 100);
    }
    
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
