#include "battery_monitor.h"
#include "logger.h"

extern Logger logger;

BatteryMonitor::BatteryMonitor()
    : voltage(0.0), percentage(0), lastUpdate(0), updateInterval(1000), voltageInitialized(false), lastRawAdcMilliVolts(0) {
}

BatteryMonitor::~BatteryMonitor() {
}

#if defined(BOARD_BATTERY_MONITOR_DISABLED)

bool BatteryMonitor::init() {
  logger.info("Battery monitor: uit (carrier v1.1 heeft geen Li-Po ADC; GPIO4 = WDT_DONE)");
  voltage = 0.0f;
  percentage = -1;
  voltageInitialized = false;
  lastRawAdcMilliVolts = 0;
  return true;
}

float BatteryMonitor::readVoltage() {
  return 0.0f;
}

int BatteryMonitor::calculatePercentage(float /*voltage*/) {
  return -1;
}

void BatteryMonitor::update() {
  (void)lastUpdate;
}

float BatteryMonitor::getVoltage() {
  return 0.0f;
}

int BatteryMonitor::getPercentage() {
  return -1;
}

bool BatteryMonitor::isLow() {
  return false;
}

bool BatteryMonitor::isCritical() {
  return false;
}

#else  /* Battery-ADC actief (niet-carrier build) */

bool BatteryMonitor::init() {
#if defined(BOARD_BATTERY_ADC_HOLD_PIN)
  pinMode(BOARD_BATTERY_ADC_HOLD_PIN, OUTPUT);
  digitalWrite(BOARD_BATTERY_ADC_HOLD_PIN, BOARD_BATTERY_ADC_HOLD_LEVEL);
#endif
  pinMode(BATTERY_ADC_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);
  delay(10);

  uint32_t rawCounts  = analogRead(BATTERY_ADC_PIN);
  uint32_t rawMv      = analogReadMilliVolts(BATTERY_ADC_PIN);
  logger.info(String("Batterij ADC init – GPIO") + BATTERY_ADC_PIN +
              ": raw=" + rawCounts + " counts, " + rawMv + " mV" +
              " | divider×" + String(BATTERY_VOLTAGE_DIVIDER_RATIO, 1) +
              " → " + String(rawMv * BATTERY_VOLTAGE_DIVIDER_RATIO / 1000.0f, 2) + " V geschat");

  update();
  logger.info("Battery monitor initialized: " + String(voltage, 2) + "V (" + String(percentage) + "%)");
  return true;
}

float BatteryMonitor::readVoltage() {
#if defined(BOARD_BATTERY_ADC_HOLD_PIN)
  const uint8_t holdPin = BOARD_BATTERY_ADC_HOLD_PIN;
  pinMode(holdPin, OUTPUT);
  digitalWrite(holdPin, BOARD_BATTERY_ADC_HOLD_LEVEL);
  delayMicroseconds(800);
#endif
  uint32_t sumMv = 0;
  for (int i = 0; i < 8; i++) {
    sumMv += analogReadMilliVolts(BATTERY_ADC_PIN);
    delay(2);
  }
  lastRawAdcMilliVolts = sumMv / 8;

  if (lastRawAdcMilliVolts == 0) {
    uint32_t counts = analogRead(BATTERY_ADC_PIN);
    if (counts > 0) {
      lastRawAdcMilliVolts = (uint32_t)((float)counts / 4095.0f * 3100.0f);
    }
  }

  float vBatt = (float)lastRawAdcMilliVolts
                * BATTERY_VOLTAGE_DIVIDER_RATIO
                * BATTERY_CALIBRATION_FACTOR
                / 1000.0f;
  return vBatt;
}

int BatteryMonitor::calculatePercentage(float voltage) {
  if (voltage >= BATTERY_FULL_VOLTAGE) {
    return 100;
  }
  if (voltage <= BATTERY_EMPTY_VOLTAGE) {
    return 0;
  }
  float range = BATTERY_FULL_VOLTAGE - BATTERY_EMPTY_VOLTAGE;
  float level = voltage - BATTERY_EMPTY_VOLTAGE;
  int percent = (int)((level / range) * 100.0);
  return constrain(percent, 0, 100);
}

void BatteryMonitor::update() {
  unsigned long now = millis();
  if (now - lastUpdate >= updateInterval) {
    float rawVoltage = readVoltage();

    if (!voltageInitialized) {
      voltage = rawVoltage;
      voltageInitialized = true;
    } else {
      voltage = voltage * (1.0f - BATTERY_SMOOTH_ALPHA) + rawVoltage * BATTERY_SMOOTH_ALPHA;
    }

    int rawPercent = calculatePercentage(voltage);
    if (rawPercent >= 100) {
      percentage = 100;
    } else {
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

#endif /* BOARD_BATTERY_MONITOR_DISABLED */
