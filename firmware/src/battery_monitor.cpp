#include "battery_monitor.h"
#include "logger.h"

extern Logger logger;

BatteryMonitor::BatteryMonitor()
    : voltage(0.0), percentage(0), lastUpdate(0), updateInterval(1000), voltageInitialized(false), lastRawAdcMilliVolts(0) {
}

BatteryMonitor::~BatteryMonitor() {
}

bool BatteryMonitor::init() {
#if defined(BOARD_BATTERY_ADC_HOLD_PIN)
  pinMode(BOARD_BATTERY_ADC_HOLD_PIN, OUTPUT);
  digitalWrite(BOARD_BATTERY_ADC_HOLD_PIN, BOARD_BATTERY_ADC_HOLD_LEVEL);
#endif
  pinMode(BATTERY_ADC_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);  // Per-pin 0-3.1V, werkt ook als global al gezet is
  delay(10);  // ADC stabiel laten worden na herconfiguratie

  // Diagnostiek: lees direct ruwe ADC-waarden om te verifiëren dat het circuit werkt
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

  // Als analogReadMilliVolts 0 teruggeeft maar analogRead wél counts heeft →
  // fallback: bereken mV zelf (3100 mV = full scale bij 11dB, 4095 counts)
  if (lastRawAdcMilliVolts == 0) {
    uint32_t counts = analogRead(BATTERY_ADC_PIN);
    if (counts > 0) {
      lastRawAdcMilliVolts = (uint32_t)((float)counts / 4095.0f * 3100.0f);
    }
  }

  // Kalibratiegeboekte ×divider, dan ×calibratie — eenmalig hier, NIET in update()
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
    // Kalibratiegeboekte zit al verwerkt in readVoltage() – niet opnieuw toepassen
    
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
