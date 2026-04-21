#include "watchdog_tpl5010.h"
#include "pins_carrier.h"
#include "logger.h"
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <esp_rom_sys.h>
#include <esp_task_wdt.h>
#include <soc/gpio_reg.h>
#include <soc/gpio_struct.h>

extern Logger logger;

/*
 * Watchdog-laag (carrier v1.1)
 * =========================================================================
 * Combineert hardware-WDT (TPL5010, extern op carrier) met software-WDT
 * (esp_task_wdt, ingebouwd in ESP32). Zie header voor achtergrond.
 *
 * 1) TPL5010-hardware-watchdog
 *    Net WDT_DONE  = ESP32 GPIO 4
 *    Net WDT_RESET = TPL5010 RST → ESP32 EN (hardware-reset pad)
 *
 *    Strategie: een dedicated FreeRTOS-task (core 0, prio 5, 10 ms periode)
 *    pulseert GPIO 4 via directe register-writes (IRAM-safe, niet afhankelijk
 *    van loop() of een specifieke core). De task overleeft blocking calls in
 *    setup()/loop() zoals NVS-writes, SPI-transacties en WiFi-scans.
 *
 *    BEKEND GEDRAG OP CARRIER v1.1 (hardware-issue, NIET software):
 *    Ondanks dat de kick-task aantoonbaar op 10 ms ritme pulseert (zie
 *    s_kicks-teller), reset de TPL5010 het board rond ~10 s uptime (reset-
 *    reden POWERON, d.w.z. EN wordt extern laag getrokken). Waarschijnlijke
 *    oorzaken:
 *      - DONE-trace op carrier niet correct gerouteerd naar TPL5010 pin 4.
 *      - Pulse-amplitude/edge wordt afgezwakt door de LilyGO battery-divider
 *        op GPIO 4.
 *      - TPL5010 DELAY/M_RST verkeerd gedimensioneerd.
 *    Diagnose: scope GPIO 4 op header én op TPL5010 pin 4. Verwachting:
 *    100 µs pulses @ 100 Hz.
 *    Workaround voor development: cut-and-jump WDT_RESET los van ESP32 EN,
 *    of zet een pull-up op WDT_RESET zodat de TPL5010 geen reset meer kan
 *    trekken. De firmware blijft kicken; zodra de hardware-fix er is werkt
 *    de WDT zonder verdere code-wijziging.
 *
 * 2) Software-watchdog (esp_task_wdt / MWDT)
 *    ESP32 interne task-watchdog-timer. Bewaakt de Arduino-loop-task: als
 *    die geen esp_task_wdt_reset() doet binnen WDT_SW_TIMEOUT_SEC, triggert
 *    de chip een panic-reset. Volledig onafhankelijk van de TPL5010.
 *    Ruime timeout zodat trage maar normale operaties (WiFi-associatie,
 *    modem-wake, HTTP-request met retries) niet per ongeluk als hang worden
 *    aangezien. kickWatchdog() doet eveneens een reset van deze WDT.
 */

namespace {
constexpr uint16_t   WDT_PULSE_US             = 100;
constexpr TickType_t WDT_KICK_PERIOD_TICKS    = pdMS_TO_TICKS(10);  // 10 ms
constexpr uint32_t   WDT_SW_TIMEOUT_SEC       = 30;                 // MWDT timeout

bool             s_hw_initialized   = false;
bool             s_sw_initialized   = false;
TaskHandle_t     s_kickTask         = nullptr;
TaskHandle_t     s_loopTask         = nullptr;   // task die kickWatchdog() aanroept (loop)
volatile uint32_t s_kicks            = 0;

#if (PIN_WDT_DONE < 32)
constexpr uint32_t WDT_GPIO_MASK = (1UL << PIN_WDT_DONE);
inline void IRAM_ATTR kickPulse() {
  GPIO.out_w1ts = WDT_GPIO_MASK;
  esp_rom_delay_us(WDT_PULSE_US);
  GPIO.out_w1tc = WDT_GPIO_MASK;
}
#else
#  error "PIN_WDT_DONE > 31 niet ondersteund in deze fast-path"
#endif

void kickTask(void* /*arg*/) {
  TickType_t wake = xTaskGetTickCount();
  for (;;) {
#ifndef WDT_DISABLE_KICK
    kickPulse();
#endif
    s_kicks++;
    vTaskDelayUntil(&wake, WDT_KICK_PERIOD_TICKS);
  }
}

void initSoftwareWdt() {
  // Arduino-ESP32 kan de TWDT al hebben aangemaakt; in dat geval
  // hergebruiken we die door onze timeout op te leggen en de loop-task toe
  // te voegen. Panic=true → bij timeout volgt een system-reset met reden
  // TASK_WDT, zodat we het in de boot-log kunnen terugzien.
  esp_err_t initErr = esp_task_wdt_init(WDT_SW_TIMEOUT_SEC, /*panic=*/ true);
  if (initErr != ESP_OK && initErr != ESP_ERR_INVALID_STATE) {
    logger.warn(String("[WATCHDOG] SW-WDT init error=") + initErr);
    return;
  }
  s_loopTask = xTaskGetCurrentTaskHandle();
  esp_err_t addErr = esp_task_wdt_add(s_loopTask);
  if (addErr != ESP_OK) {
    logger.warn(String("[WATCHDOG] SW-WDT add error=") + addErr);
    return;
  }
  s_sw_initialized = true;
  logger.info(String("[WATCHDOG] SW-WDT actief op loop-task, timeout=")
              + WDT_SW_TIMEOUT_SEC + " s");
}
} // namespace

uint32_t watchdogIsrKickCount() { return s_kicks; }
uint32_t watchdogVerifiedKickCount() { return 0; }

void initWatchdog() {
  // --- 1) Hardware-WDT (TPL5010) ----------------------------------------
  pinMode(PIN_WDT_DONE, OUTPUT);
  GPIO.out_w1tc = WDT_GPIO_MASK;   // start LOW
  s_hw_initialized = true;

#ifndef WDT_DISABLE_KICK
  kickPulse();                     // eerste kick direct na boot
#endif

  if (s_kickTask == nullptr) {
    // Core 0, prio 5: hoger dan Arduino loop (1), lager dan WiFi/ipc (≥18).
    xTaskCreatePinnedToCore(
        kickTask,
        "wdtKick",
        2048,
        nullptr,
        5,
        &s_kickTask,
        0);
  }

  logger.info(String("[WATCHDOG] TPL5010 DONE=GPIO") + PIN_WDT_DONE +
              " task-kick elke 10 ms (puls " + WDT_PULSE_US + " µs, core 0)");

  // --- 2) Software-WDT (esp_task_wdt) -----------------------------------
  initSoftwareWdt();
}

void kickWatchdog() {
  // HW-pulse: ook handig als setup() nog niet helemaal door is en de task
  // (die anders elke 10 ms kickt) theoretisch ergens verhongert.
  if (s_hw_initialized) {
#ifndef WDT_DISABLE_KICK
    kickPulse();
#endif
  }

  // SW-WDT: reset enkel vanuit de task die via esp_task_wdt_add() is
  // geregistreerd (= de loop-task). Roepen we dit vanuit een andere task,
  // dan levert reset() ESP_ERR_NOT_FOUND op, wat onschadelijk is — we
  // negeren de return-value bewust.
  if (s_sw_initialized) {
    esp_task_wdt_reset();
  }
}
