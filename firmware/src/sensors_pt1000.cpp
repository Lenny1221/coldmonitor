#include "sensors_pt1000.h"
#include "pins_carrier.h"
#include "logger.h"
#include <Adafruit_MAX31865.h>

extern Logger logger;

namespace {

Adafruit_MAX31865 s_sensors[PT1000_COUNT] = {
    Adafruit_MAX31865(PIN_MAX31865_CS1, PIN_SPI_MOSI, PIN_SPI_MISO, PIN_SPI_SCK),
    Adafruit_MAX31865(PIN_MAX31865_CS2, PIN_SPI_MOSI, PIN_SPI_MISO, PIN_SPI_SCK),
};

bool     s_initOk[PT1000_COUNT] = {false, false};
uint8_t  s_lastFault[PT1000_COUNT] = {0, 0};
float    s_lastTempC[PT1000_COUNT] = {NAN, NAN};

inline bool validIdx(uint8_t idx) { return idx < PT1000_COUNT; }

} // namespace

bool initSensors() {
  int okCount = 0;
  for (uint8_t i = 0; i < PT1000_COUNT; i++) {
    s_sensors[i].begin(MAX31865_2WIRE);
    // 50 Hz notch voor EU-net (onderdrukt mains-inductie op 2-wire leidingen).
    s_sensors[i].enable50Hz(true);
    delay(20);

    // --- Diagnose: ruwe 15-bit RTD + berekende weerstand ---
    // RTDraw = 0x0000 → SPI komt niet door / chip niet aangesloten of 'altijd 0'.
    // RTDraw = 0x7FFF → open input / RREF verkeerd → fault ook set.
    // Rrtd  ≈ 1000 Ω  → PT1000 rond 0 °C.
    // Rrtd  ≈ 100 Ω   → PT100 (dan is RREF op PCB waarsch. 430 Ω i.p.v. 4020 Ω).
    uint16_t rtdRaw = s_sensors[i].readRTD();
    float    rrtd   = ((float)rtdRaw * PT1000_RREF_OHM) / 32768.0f;

    float t = s_sensors[i].temperature(PT1000_RNOMINAL_OHM, PT1000_RREF_OHM);
    uint8_t fault = s_sensors[i].readFault();
    if (fault) s_sensors[i].clearFault();

    logger.info(String("[SENSOR] #") + (i + 1) +
                " diag: CS=GPIO" + (i == 0 ? PIN_MAX31865_CS1 : PIN_MAX31865_CS2) +
                " RTDraw=0x" + String(rtdRaw, HEX) +
                " (" + rtdRaw + ") Rrtd≈" + String(rrtd, 1) + "Ω" +
                " fault=0x" + String(fault, HEX));

    bool ok = (fault == 0) && !isnan(t) && t > -200.0f && t < 200.0f;
    s_initOk[i]    = ok;
    s_lastFault[i] = fault;
    s_lastTempC[i] = ok ? t : NAN;

    if (ok) {
      logger.info("[SENSOR] #" + String(i + 1) + " OK (" + String(t, 1) + "°C)");
      okCount++;
    } else if (fault != 0) {
      logger.warn("[SENSOR] #" + String(i + 1) + " FAULT (0x" + String(fault, HEX) + ")");
    } else {
      // Chip reageert niet of PT1000 niet bedraad (readings buiten bereik, fault=0).
      logger.warn("[SENSOR] #" + String(i + 1) + " NOT DETECTED (check wiring / RREF)");
    }
  }
  return okCount > 0;
}

float readSensor(uint8_t idx) {
  if (!validIdx(idx)) return NAN;

  // Diagnose ook op reguliere reads, zodat we kunnen zien of een sensor die
  // tijdens init niet "OK" was, intussen wél plausibele data geeft (bv. na
  // hot-plug van een probe). Niet te spammy: we loggen enkel als hij niet-OK
  // is, of als het resultaat buiten de redelijke range valt.
  uint16_t rtdRaw = s_sensors[idx].readRTD();
  float    rrtd   = ((float)rtdRaw * PT1000_RREF_OHM) / 32768.0f;

  float t = s_sensors[idx].temperature(PT1000_RNOMINAL_OHM, PT1000_RREF_OHM);
  uint8_t fault = s_sensors[idx].readFault();
  if (fault) {
    s_sensors[idx].clearFault();
    s_lastFault[idx] = fault;
    s_lastTempC[idx] = NAN;
    logger.warn(String("[SENSOR] #") + (idx + 1) +
                " read fault=0x" + String(fault, HEX) +
                " RTDraw=0x" + String(rtdRaw, HEX) +
                " Rrtd≈" + String(rrtd, 1) + "Ω");
    return NAN;
  }
  if (isnan(t) || t <= -200.0f || t >= 200.0f) {
    s_lastTempC[idx] = NAN;
    logger.warn(String("[SENSOR] #") + (idx + 1) +
                " read out-of-range: RTDraw=0x" + String(rtdRaw, HEX) +
                " Rrtd≈" + String(rrtd, 1) + "Ω t=" + String(t, 2) + "°C");
    return NAN;
  }
  s_lastFault[idx] = 0;
  s_lastTempC[idx] = t;
  if (!s_initOk[idx]) {
    logger.info(String("[SENSOR] #") + (idx + 1) +
                " nu geldig: RTDraw=0x" + String(rtdRaw, HEX) +
                " Rrtd≈" + String(rrtd, 1) + "Ω t=" + String(t, 2) + "°C");
    s_initOk[idx] = true;
  }
  return t;
}

uint8_t sensorFault(uint8_t idx) {
  if (!validIdx(idx)) return 0xFF;
  uint8_t f = s_sensors[idx].readFault();
  if (f) s_sensors[idx].clearFault();
  s_lastFault[idx] = f;
  return f;
}

bool sensorOk(uint8_t idx) {
  if (!validIdx(idx)) return false;
  return s_initOk[idx] && !isnan(s_lastTempC[idx]);
}
