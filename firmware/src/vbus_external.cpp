#include "vbus_external.h"
#include "pins_carrier.h"
#include "logger.h"

extern Logger logger;

/*
 * VBUS-detectie op carrier v1.1 — Hardware-context
 * --------------------------------------------------------------------------
 * GPIO 1 (ADC1_CH0) wordt aangedreven door een R-deler op de carrier
 * (R17=100k boven, R18=56k onder, met BAT54-7-F in serie en R16=10k ESD).
 *
 * 5 V → BAT54 (~0.3 V drop) → 100k → divider-knoop → 56k → GND.
 *
 * Effectieve spanning op de divider-knoop bij USB-C aangesloten:
 *   V ≈ 4.7 V × 56 / (100 + 56) ≈ 1.69 V
 *
 * 1.69 V is BENEDEN V_IH = 0.75 × VDD = 2.475 V van de ESP32-S3, dus
 * digitalRead() leest dit als LOW. Daarom valt de USB-C-detectie niet aan
 * met `pinMode(INPUT)` + `digitalRead()`.
 *
 * Twee oplossingen, beide hier toegepast:
 *
 *  1. analoog meten via analogRead() en zelf een drempel zetten
 *     (~700 mV). Dit is RUIMTERS de meest betrouwbare aanpak omdat de
 *     ADC perfect onderscheid kan maken tussen 0 V (no USB) en 1.69 V
 *     (USB present), zonder afhankelijk te zijn van logic-thresholds.
 *
 *  2. Een eenmalige boot-diagnose die GPIO 1 in 3 digital-modes test
 *     (zwevend, met pullup, met pulldown) zodat we visueel kunnen zien
 *     of het divider-circuit elektrisch werkt zoals verwacht.
 *
 * Hardware-fix (TODO permanent): vervang R18 door 150k of R17 door 47k
 * zodat de divider boven V_IH uitkomt en digitalRead() weer kan worden
 * gebruikt.
 */

namespace {
// Drempel in mV. Bij verwachte 1.69 V op USB-C en 0 V zonder USB-C is
// 700 mV een ruime middenweg met sterke noise-marge aan beide kanten.
constexpr int VBUS_THRESHOLD_MV = 700;

int readVbusMilliVolts() {
  // analogReadMilliVolts past automatisch attenuatie + factory-calibration
  // toe (Espressif eFuse). Voor ADC1_CH0 (GPIO 1) is dit de aanbevolen
  // API in Arduino-ESP32 ≥ 2.0.x.
  return analogReadMilliVolts(PIN_VBUS_DETECT);
}
}  // namespace

void initExternalPowerSense() {
  // ----- 1) Boot-diagnose: digital read in 3 pull-modes ---------------
  pinMode(PIN_VBUS_DETECT, INPUT);
  delay(5);
  int floatRead = digitalRead(PIN_VBUS_DETECT);
  pinMode(PIN_VBUS_DETECT, INPUT_PULLUP);
  delay(5);
  int puRead    = digitalRead(PIN_VBUS_DETECT);
  pinMode(PIN_VBUS_DETECT, INPUT_PULLDOWN);
  delay(5);
  int pdRead    = digitalRead(PIN_VBUS_DETECT);

  logger.info(String("[VBUS-DIAG] GPIO") + PIN_VBUS_DETECT +
              " digital float=" + floatRead +
              " pullup=" + puRead +
              " pulldown=" + pdRead);

  if (floatRead == HIGH && puRead == HIGH && pdRead == HIGH) {
    logger.info("[VBUS-DIAG] -> Extern actief HIGH (5 V aanwezig, divider OK)");
  } else if (floatRead == LOW && puRead == HIGH && pdRead == LOW) {
    logger.warn("[VBUS-DIAG] -> Digital LOW; verwacht: divider levert te lage V voor V_IH. Analoge meting volgt.");
  } else if (floatRead == LOW && puRead == LOW && pdRead == LOW) {
    logger.warn("[VBUS-DIAG] -> Pin hard naar GND getrokken (short of foute divider-richting)");
  } else if (floatRead == HIGH && puRead == HIGH && pdRead == LOW) {
    logger.warn("[VBUS-DIAG] -> Zwakke HIGH: divider werkt maar net (borderline)");
  } else {
    logger.warn(String("[VBUS-DIAG] -> Inconsistente combinatie f/pu/pd=")
                + floatRead + "/" + puRead + "/" + pdRead);
  }

  // ----- 2) Analoge meting via ADC ------------------------------------
  // Sluit interne pulls af zodat de hardware-divider alleen telt.
  pinMode(PIN_VBUS_DETECT, INPUT);
  // Vol bereik (~3.3 V) voor de ADC; 1.69 V valt comfortabel hierin.
  analogSetPinAttenuation(PIN_VBUS_DETECT, ADC_11db);
  delay(5);
  int mv = readVbusMilliVolts();
  logger.info(String("[VBUS-DIAG] ADC GPIO") + PIN_VBUS_DETECT +
              " = " + mv + " mV (drempel " + VBUS_THRESHOLD_MV + " mV)");
  if (mv >= VBUS_THRESHOLD_MV) {
    logger.info("[VBUS-DIAG] -> ADC zegt: USB-C aanwezig");
  } else {
    logger.info("[VBUS-DIAG] -> ADC zegt: USB-C niet aangesloten");
  }
}

bool isExternalPowerPresent() {
  // Analoge meting > drempel = USB-C levert 5 V.
  // Robuust tegen de borderline 1.69 V die digitalRead() niet betrouwbaar
  // ziet als HIGH. Eén losse sample is genoeg; ADC-ruis bij 0 V vs 1.69 V
  // is ruimschoots binnen de marge.
  int mv = readVbusMilliVolts();
  return mv >= VBUS_THRESHOLD_MV;
}
