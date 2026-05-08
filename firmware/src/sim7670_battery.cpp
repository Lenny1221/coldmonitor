#include "sim7670_battery.h"
#include "logger.h"

extern Logger logger;

namespace {

// LilyGO T-SIM7670G S3 modem-pinnen (intern op LilyGO board, niet op carrier-headers)
constexpr int  PIN_PWRKEY = 18;
constexpr int  PIN_DTR    =  9;
constexpr int  PIN_TX     = 11;   // ESP32 -> modem (modem RX)
constexpr int  PIN_RX     = 10;   // modem -> ESP32 (modem TX)

constexpr unsigned long MODEM_BAUD          = 115200;
constexpr unsigned long BOOT_GRACE_MS       = 12000;   // SIM7670G boot ~10 s na PWRKEY
constexpr unsigned long AT_PROBE_INTERVAL   = 1000;    // tijdens BOOTING: AT-probe elke 1 s
constexpr unsigned long POLL_INTERVAL_MS    = 30000;   // READY: AT+CBC elke 30 s
constexpr unsigned long AT_TIMEOUT_MS       = 1500;
constexpr unsigned long PROBE_GIVE_UP_MS    = 60000;   // 60 s zonder respons -> opgeven, geen modem

enum class State : uint8_t { OFF, BOOTING, READY, FAILED };

State          s_state         = State::OFF;
unsigned long  s_pwrkeyDoneAt  = 0;
unsigned long  s_lastProbe     = 0;
unsigned long  s_lastPoll      = 0;
int            s_voltageMv     = -1;
int            s_percentage    = -1;
HardwareSerial* s_modem        = nullptr;

int voltageToPct(int mv) {
  // Lineaire Li-Ion benadering. Niet exact (cel hangt lang rond 3.7 V) maar
  // ruim voldoende voor een UI-status. 3.0 V -> 0 %, 4.2 V -> 100 %.
  if (mv <= 0)    return -1;
  if (mv >= 4200) return 100;
  if (mv <= 3000) return 0;
  return (int)((long)(mv - 3000) * 100L / (4200 - 3000));
}

void drainSerial() {
  if (!s_modem) return;
  while (s_modem->available()) (void)s_modem->read();
}

bool sendAndExpectOk(const char* cmd, unsigned long timeoutMs, String* outResp) {
  if (!s_modem) return false;
  drainSerial();
  s_modem->print(cmd);
  s_modem->print("\r\n");

  String resp;
  resp.reserve(64);
  unsigned long deadline = millis() + timeoutMs;
  while ((long)(deadline - millis()) > 0) {
    while (s_modem->available()) {
      char c = (char)s_modem->read();
      resp += c;
      if (resp.endsWith("\r\nOK\r\n") || resp.endsWith("OK\r\n")) {
        if (outResp) *outResp = resp;
        return true;
      }
      if (resp.endsWith("ERROR\r\n")) {
        if (outResp) *outResp = resp;
        return false;
      }
    }
    delay(2);
  }
  if (outResp) *outResp = resp;
  return false;
}

bool parseCbcResponse(const String& resp, int& outMv) {
  // Mogelijke formaten:
  //   "+CBC: 1,75,3920"   (legacy: bcs,bcl,mV)
  //   "+CBC: 3920"        (alleen mV)
  //   "+CBC: 4.234V"      (sommige firmwares: V met suffix)
  int idx = resp.indexOf("+CBC:");
  if (idx < 0) return false;
  String tail = resp.substring(idx + 5);
  // Strip alles na de eerste regel
  int eolA = tail.indexOf('\r');
  int eolB = tail.indexOf('\n');
  int eol = -1;
  if (eolA >= 0 && eolB >= 0) eol = (eolA < eolB) ? eolA : eolB;
  else if (eolA >= 0)         eol = eolA;
  else if (eolB >= 0)         eol = eolB;
  if (eol >= 0) tail = tail.substring(0, eol);
  tail.trim();

  // Pak het laatste komma-gescheiden veld (= V of mV)
  String last;
  int comma = tail.lastIndexOf(',');
  last = (comma >= 0) ? tail.substring(comma + 1) : tail;
  last.trim();
  last.replace("V", "");
  last.replace("v", "");
  last.trim();
  if (last.length() == 0) return false;

  float v = last.toFloat();
  if (v <= 0.0f) return false;
  // < 100 lijkt op Volts, >= 100 lijkt op mV
  outMv = (v < 100.0f) ? (int)(v * 1000.0f + 0.5f) : (int)(v + 0.5f);
  return outMv > 0;
}

} // namespace

namespace sim7670 {

void init() {
  if (s_state != State::OFF) return;

  // PWRKEY-puls: SIM7670G boot-sequentie
  pinMode(PIN_PWRKEY, OUTPUT);
  digitalWrite(PIN_PWRKEY, LOW);
  delay(100);
  digitalWrite(PIN_PWRKEY, HIGH);
  delay(1000);
  digitalWrite(PIN_PWRKEY, LOW);

  // DTR LOW -> modem blijft wakker (geen sleep-modus)
  pinMode(PIN_DTR, OUTPUT);
  digitalWrite(PIN_DTR, LOW);

  // UART2 voor modem (UART1 = RS485, UART0 = USB-CDC)
  s_modem = &Serial2;
  s_modem->begin(MODEM_BAUD, SERIAL_8N1, PIN_RX, PIN_TX);

  s_pwrkeyDoneAt = millis();
  s_state        = State::BOOTING;

  logger.info("[SIM7670] PWRKEY-puls verstuurd. Modem boot ~10 s, dan AT+CBC elke 30 s.");
}

void update() {
  if (s_state == State::OFF || s_state == State::FAILED) return;
  if (!s_modem) return;
  unsigned long now = millis();

  if (s_state == State::BOOTING) {
    if (now - s_pwrkeyDoneAt < BOOT_GRACE_MS) return;
    if (now - s_lastProbe < AT_PROBE_INTERVAL) return;
    s_lastProbe = now;

    String resp;
    if (sendAndExpectOk("AT", AT_TIMEOUT_MS, &resp)) {
      logger.info("[SIM7670] modem online (AT OK)");
      // Echo uit zodat onze parser niet over de verstuurde commando-echo struikelt
      sendAndExpectOk("ATE0", AT_TIMEOUT_MS, nullptr);
      s_state    = State::READY;
      s_lastPoll = 0;     // forceer onmiddellijke eerste meting
      return;
    }

    // 60 s na PWRKEY zonder respons -> opgeven (modem niet aanwezig of stuk)
    if (now - s_pwrkeyDoneAt > PROBE_GIVE_UP_MS) {
      s_state = State::FAILED;
      logger.warn("[SIM7670] geen AT-respons na 60 s; batterij-readout blijft uit.");
    }
    return;
  }

  // READY: AT+CBC elke POLL_INTERVAL_MS
  if (s_lastPoll != 0 && now - s_lastPoll < POLL_INTERVAL_MS) return;
  s_lastPoll = now;

  String resp;
  if (!sendAndExpectOk("AT+CBC", AT_TIMEOUT_MS, &resp)) {
    logger.debug("[SIM7670] AT+CBC zonder OK-respons");
    return;
  }
  int mv = -1;
  if (!parseCbcResponse(resp, mv)) {
    String redacted = resp;
    redacted.replace("\r", "\\r");
    redacted.replace("\n", "\\n");
    logger.warn(String("[SIM7670] AT+CBC parse-fout: ") + redacted);
    return;
  }
  s_voltageMv  = mv;
  s_percentage = voltageToPct(mv);
  logger.info(String("[SIM7670] batterij = ") + (mv / 1000.0f) + " V (" + s_percentage + " %)");
}

bool isReady()       { return s_state == State::READY && s_voltageMv > 0; }
int  getVoltageMv()  { return s_voltageMv; }
int  getPercentage() { return s_percentage; }

} // namespace sim7670
