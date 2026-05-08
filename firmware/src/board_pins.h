#ifndef BOARD_PINS_H
#define BOARD_PINS_H

/**
 * Hardware: LilyGO T-SIM7670G-S3 op carrier-PCB v1.1.
 * Alle BOARD_*-waarden moeten gelijk lopen met `pins_carrier.h`.
 *
 * Belangrijk voor deze pinout:
 *  - GPIO 12: LilyGO charge-LED, NIET gebruiken op carrier.
 *  - GPIO 4 : LilyGO BAT_ADC, NIET gebruiken op carrier.
 *  - GPIO 5 : WDT_DONE-puls naar TPL5010.
 *  - VBUS-detectie digitaal op GPIO 1 (BAT54 + deler achter USB-C).
 */

#if !defined(BOARD_LILYGO_T_SIM7670G_S3)
#error "Build flag -DBOARD_LILYGO_T_SIM7670G_S3=1 ontbreekt: carrier-firmware vereist de LilyGO T-SIM7670G-S3 build."
#endif

#define COLDMONITOR_BOARD_NAME "Carrier v1.1 (LilyGO T-SIM7670G S3)"

/* ---- Knoppen ------------------------------------------------------------ */
#define BOARD_BOOT_PIN 0        /* BOOT-knop op LilyGO (factory-reset) */

/* ---- Status-LED --------------------------------------------------------- */
/*
 * Carrier v1.1 heeft geen gebruiker-LED: GPIO 12 is de originele charge-LED
 * en blijft op de carrier ongebruikt. BOARD_STATUS_LED_PIN is een sentinel
 * en alle LED-macros zijn no-ops, zodat legacy-code ongewijzigd compileert.
 */
#define BOARD_STATUS_LED_PIN (-1)
#define BOARD_HAS_STATUS_LED 0
#define BOARD_LED_ACTIVE_LOW 1
#define BOARD_LED_LEVEL_ON  LOW
#define BOARD_LED_LEVEL_OFF HIGH

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
#define BOARD_MAX31865_SCK  21   /* U6-2  SCLK */
#define BOARD_MAX31865_MOSI 14   /* U6-3  MOSI */
#define BOARD_MAX31865_MISO 47   /* U7-14 MISO */
#define BOARD_MAX31865_CS   48   /* U7-13 CS_U4 (sensor 1 / ruimte). PCB v1.1 wired
                                    op GPIO48; oude tabel zei GPIO15 maar dat klopt niet. */
/* Sensor 2 CS leeft enkel in pins_carrier.h → PIN_MAX31865_CS2 (GPIO 13). */

/* ---- Deur-contact (reed switch) ----------------------------------------- */
#define BOARD_DOOR_PIN 2         /* U7-6 REED_SWITCH */

/* ---- RS485 / Modbus (MAX3485) ------------------------------------------- */
#define BOARD_RS485_TX 38        /* U7-11 → DI */
#define BOARD_RS485_RX 39        /* U7-10 → RO */
#define BOARD_RS485_DE 40        /* U7-9  → DE + /RE */

/* ---- Batterij-monitor: UIT op carrier ----------------------------------- */
/*
 * Geen Li-Po ADC op carrier. GPIO 4 (de vroegere BAT_ADC) mag sowieso niet
 * als ADC gebruikt worden op dit board.
 */
#define BOARD_BATTERY_MONITOR_DISABLED 1

/* ---- Externe-voeding-detectie via VBUS_DETECT --------------------------- */
/*
 * Digitaal signaal op GPIO 1 (U7-5): HIGH = USB-C / externe voeding aanwezig.
 * PowerMonitor leest PIN_VBUS_DETECT uit pins_carrier.h.
 */
#define BOARD_POWER_MONITOR_DISABLED 1
#define BOARD_POWER_MONITOR_LOG_NAME "Externe voeding (VBUS_DETECT)"

#endif /* BOARD_PINS_H */
