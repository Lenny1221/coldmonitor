#ifndef BOARD_PINS_H
#define BOARD_PINS_H

/**
 * Hardware: LilyGO T-SIM7670G-S3 op **carrier-PCB v1.1** (JLCPCB).
 * Afgeleid uit de Altium-schematic (Sheet_1.schdoc, 2026-04-11).
 * Zie ook `pins_carrier.h` voor de volledige net-naam → GPIO mapping.
 *
 * Deze file definieert BOARD_*-macros die door de bestaande modules gedeeld
 * worden (`sensors.h`, `config.cpp`, `reset_button.cpp`, …). Alle waarden
 * moeten consistent zijn met `pins_carrier.h`.
 *
 * De oude SimShield- / "Standard"- / ESP32-DevKit-varianten zijn verwijderd:
 * deze firmware draait uitsluitend op de carrier-PCB v1.1.
 */

#if !defined(BOARD_LILYGO_T_SIM7670G_S3)
#error "Build flag -DBOARD_LILYGO_T_SIM7670G_S3=1 ontbreekt: carrier-firmware vereist de LilyGO T-SIM7670G-S3 build."
#endif

#define COLDMONITOR_BOARD_NAME "Carrier v1.1 (LilyGO T-SIM7670G S3)"

/* ---- Knoppen ------------------------------------------------------------ */
#define BOARD_BOOT_PIN 0        /* BOOT-knop op LilyGO (factory-reset) */

/* ---- Status-LED --------------------------------------------------------- */
/*
 * De carrier heeft GEEN gebruiker-bestuurbare LED: GPIO 12 (de LilyGO
 * charge-LED) is op de carrier her-bedraad als VBUS_DETECT (INPUT). Daarom
 * is BOARD_STATUS_LED_PIN een sentinel (-1) en zijn de helper-macros no-ops.
 * Alle consumer-code (main.cpp, reset_button.cpp, …) gebruikt
 * BOARD_LED_SET/TOGGLE en mag deze ongewijzigd aanroepen.
 */
#define BOARD_STATUS_LED_PIN (-1)
#define BOARD_HAS_STATUS_LED 0
#define BOARD_LED_ACTIVE_LOW 1         /* Behouden voor bronvergelijkbaarheid. */
#define BOARD_LED_LEVEL_ON  LOW
#define BOARD_LED_LEVEL_OFF HIGH

/* Veilige no-ops als er geen LED is; blijft werken voor een eventuele future
 * board-variant die BOARD_HAS_STATUS_LED=1 zet. */
#if BOARD_HAS_STATUS_LED
#define BOARD_LED_SET(pin, lvl)    digitalWrite((pin), (lvl))
#define BOARD_LED_TOGGLE(pin)      \
  digitalWrite((pin), (digitalRead((pin)) == BOARD_LED_LEVEL_ON) ? BOARD_LED_LEVEL_OFF : BOARD_LED_LEVEL_ON)
#define BOARD_LED_PINMODE(pin)     pinMode((pin), OUTPUT)
#else
#define BOARD_LED_SET(pin, lvl)    do { (void)(pin); (void)(lvl); } while (0)
#define BOARD_LED_TOGGLE(pin)      do { (void)(pin); } while (0)
#define BOARD_LED_PINMODE(pin)     do { (void)(pin); } while (0)
#endif

/* ---- MAX31865 / SPI (carrier: 2× PT1000 op gedeelde SPI) ---------------- */
#define BOARD_MAX31865_SCK  21   /* net SCLK      (LilyGO-header pin 15) */
#define BOARD_MAX31865_MOSI 14   /* net SDI_MOSI  (pin 14)               */
#define BOARD_MAX31865_MISO 47   /* net SD0_MISO  (pin 19)               */
#define BOARD_MAX31865_CS   48   /* net CS-1, sensor 1 (pin 20)          */
/* Sensor 2 CS (13) leeft alleen in pins_carrier.h → PIN_MAX31865_CS2.    */

/* ---- Deur-contact (reed switch) ----------------------------------------- */
#define BOARD_DOOR_PIN 46        /* net REED_SWITCH (pin 11), RC-debounce op de carrier */

/* ---- RS485 / Modbus (MAX3485) ------------------------------------------- */
/* Op T-SIM7670G-S3 zijn GPIO 43/44 de UART0-pinnen (header-label TXD/RXD),
 * vrij omdat de USB-CDC console via GPIO 19/20 (native USB) loopt. */
#define BOARD_RS485_TX 43        /* net TX_RS → MAX3485 DI  (pin 32) */
#define BOARD_RS485_RX 44        /* net RX_RS → MAX3485 RO  (pin 31) */
#define BOARD_RS485_DE  2        /* net DE_RS → DE + /RE    (pin 27) */

/* ---- Batterij-monitor: UIT op carrier ----------------------------------- */
/*
 * Op de carrier is GPIO 4 hertoegewezen aan het WDT_DONE-net van de TPL5010
 * (pulse-output). Een Li-Po ADC-meetschakeling bestaat hier niet. De
 * BatteryMonitor-module is daarom no-op op dit board.
 */
#define BOARD_BATTERY_MONITOR_DISABLED 1
/* BOARD_BATTERY_ADC_PIN bewust NIET gedefinieerd: consumers moeten
 * BOARD_BATTERY_MONITOR_DISABLED respecteren. */

/* ---- Externe-voeding-detectie via VBUS_DETECT --------------------------- */
/*
 * Oude LilyGO-ADC-meting (GPIO5/18 voor VIN) is vervangen door de digitale
 * VBUS_DETECT ingang op GPIO 12 (BAT54 + deler: HIGH = externe voeding
 * aanwezig). PowerMonitor leest deze pin rechtstreeks; de ADC-gebaseerde
 * code is uitgeschakeld via onderstaande flag.
 */
#define BOARD_POWER_MONITOR_DISABLED 1
#define BOARD_POWER_MONITOR_LOG_NAME "Externe voeding (VBUS_DETECT)"

#endif /* BOARD_PINS_H */
