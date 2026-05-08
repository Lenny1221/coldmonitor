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

const uint8_t s_csPins[PT1000_COUNT] = { PIN_MAX31865_CS1, PIN_MAX31865_CS2 };

bool     s_initOk[PT1000_COUNT] = {false, false};
uint8_t  s_lastFault[PT1000_COUNT] = {0, 0};
float    s_lastTempC[PT1000_COUNT] = {NAN, NAN};

inline bool validIdx(uint8_t idx) { return idx < PT1000_COUNT; }

// -- Raw bit-bang software-SPI register read ---------------------------------
// We bypassen Adafruit_MAX31865 hier bewust: we willen weten of de chip
// uberhaupt iets terugstuurt (en wat) op alle 8 registers. Mode 1 (CPOL=0,
// CPHA=1): clock idle low, data sampled on falling edge — dit is de SPI-mode
// die de MAX31865 vereist.
uint8_t maxReadReg(uint8_t cs, uint8_t reg) {
  // Schrijf-bit (MSB) op 0 voor read, low-7 = adres.
  uint8_t tx = reg & 0x7F;
  digitalWrite(cs, LOW);
  delayMicroseconds(2);

  // Address byte uitsturen (MSB-first).
  for (int b = 7; b >= 0; b--) {
    digitalWrite(PIN_SPI_SCK, LOW);
    digitalWrite(PIN_SPI_MOSI, ((tx >> b) & 1) ? HIGH : LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_SPI_SCK, HIGH);
    delayMicroseconds(2);
  }
  digitalWrite(PIN_SPI_SCK, LOW);

  // Data-byte inlezen: bit gesampled op falling edge (mode 1).
  uint8_t rx = 0;
  for (int b = 7; b >= 0; b--) {
    digitalWrite(PIN_SPI_SCK, HIGH);
    delayMicroseconds(2);
    digitalWrite(PIN_SPI_SCK, LOW);
    delayMicroseconds(1);
    if (digitalRead(PIN_SPI_MISO)) rx |= (1 << b);
    delayMicroseconds(1);
  }

  digitalWrite(cs, HIGH);
  delayMicroseconds(2);
  return rx;
}

void dumpAllRegisters(uint8_t idx) {
  uint8_t cs = s_csPins[idx];
  // Bit-bang vereist dat de pinnen als output staan. Adafruit_MAX31865 heeft
  // ze al geïnitialiseerd in begin(), maar we forceren ze hier voor de zekerheid.
  pinMode(cs,            OUTPUT); digitalWrite(cs,            HIGH);
  pinMode(PIN_SPI_SCK,   OUTPUT); digitalWrite(PIN_SPI_SCK,   LOW);
  pinMode(PIN_SPI_MOSI,  OUTPUT); digitalWrite(PIN_SPI_MOSI,  LOW);
  pinMode(PIN_SPI_MISO,  INPUT);

  String line = String("[SENSOR] #") + (idx + 1) + " regs(raw): ";
  uint8_t allZero = 0, allOne = 0;
  for (uint8_t r = 0; r < 8; r++) {
    uint8_t v = maxReadReg(cs, r);
    if (v == 0x00) allZero++;
    if (v == 0xFF) allOne++;
    char buf[8];
    snprintf(buf, sizeof(buf), "%02X ", v);
    line += buf;
  }
  logger.info(line);

  if (allZero == 8) {
    logger.warn(String("[SENSOR] #") + (idx + 1) +
                " -> ALLE registers 0x00. Chip antwoordt niet. "
                "Check 3V3 op MAX31865-VDD, CS-pin (GPIO" + cs +
                ") en MISO (GPIO" + PIN_SPI_MISO + ").");
  } else if (allOne == 8) {
    logger.warn(String("[SENSOR] #") + (idx + 1) +
                " -> ALLE registers 0xFF. MISO is high-floating; chip "
                "trekt MISO niet laag. Check stroom + MISO-traceback.");
  } else {
    logger.info(String("[SENSOR] #") + (idx + 1) +
                " -> Chip leeft (registers verschillen). "
                "Config-reg (0x00) moet ~0xC1 zijn na begin(2WIRE,50Hz).");
  }
}

} // namespace

bool initSensors() {
  int okCount = 0;
  for (uint8_t i = 0; i < PT1000_COUNT; i++) {
    s_sensors[i].begin(MAX31865_2WIRE);
    // 50 Hz notch voor EU-net (onderdrukt mains-inductie op 2-wire leidingen).
    s_sensors[i].enable50Hz(true);
    delay(20);

    // Raw register-dump (bit-bang). Hierna weten we 100% zeker:
    //  - allemaal 0x00 -> chip totaal stil (geen VDD / dood IC / verkeerd CS)
    //  - allemaal 0xFF -> MISO is hoog-zwevend (geen stroom of geen MISO-tracé)
    //  - mengeling     -> chip leeft, kunnen we config + RTD-fouten lezen
    dumpAllRegisters(i);

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

  // Lazy re-init: als de sensor op dit moment niet als OK staat, proberen we
  // begin()+enable50Hz opnieuw. Bij boot kan een chip onbereikbaar zijn (bv.
  // verdamper-voeler nog niet aangesloten, of CS-trace nog niet doorverbonden);
  // zodra dat hardware-issue opgelost is willen we dat de chip automatisch
  // mee gaat draaien zonder dat de gebruiker moet rebooten. We doen dit enkel
  // wanneer s_initOk[idx] false is, dus een gezonde sensor heeft hier geen
  // overhead. Op een nog steeds dode chip kosten begin()+enable50Hz ~5 ms,
  // wat binnen de readingInterval ruim past.
  if (!s_initOk[idx]) {
    s_sensors[idx].begin(MAX31865_2WIRE);
    s_sensors[idx].enable50Hz(true);
    delay(5);
  }

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
