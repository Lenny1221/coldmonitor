#ifndef PINS_CARRIER_H
#define PINS_CARRIER_H

/**
 * Carrier-PCB v1 (JLCPCB) — logische nets tussen LilyGO T-SIM7670G-S3 headers
 * (U6/U7) en de perifere schakelingen op de carrier.
 *
 * Placeholders: exacte GPIO-nummers moeten geverifieerd worden tegen Sheet_1
 * van de EasyEDA-schematic. Laat de // TODO staan tot dat bevestigd is.
 *
 * Gereserveerd (niet opnieuw toewijzen):
 *   GPIO 4   → Battery-ADC    (BOARD_BATTERY_ADC_PIN)
 *   GPIO 12  → Status-LED     (BOARD_STATUS_LED_PIN, power_monitor)
 *   GPIO 43  → USB-CDC (TX)   (niet op header)
 *   GPIO 44  → USB-CDC (RX)   (niet op header)
 */

#include "board_pins.h"

/* ---- SPI bus (gedeeld door 2x MAX31865) -------------------------------- */
#define PIN_SPI_SCK       BOARD_MAX31865_SCK   // net SCLK
#define PIN_SPI_MOSI      BOARD_MAX31865_MOSI  // net SDI_MOSI
#define PIN_SPI_MISO      BOARD_MAX31865_MISO  // net SD0_MISO

/* Chip-selects per PT1000: CS1 = bestaande CS (al in gebruik), CS2 = nieuw op carrier. */
#define PIN_MAX31865_CS1  BOARD_MAX31865_CS    // net CS-1 (sensor 1)
#define PIN_MAX31865_CS2  16                   // TODO: confirm (net CS-2 / sensor 2, U6/U7)

/* ---- RS485 (MAX3485, half-duplex) --------------------------------------- */
#define PIN_RS485_TX      BOARD_RS485_TX       // net TX_RS (DI)
#define PIN_RS485_RX      BOARD_RS485_RX       // net RX_RS (RO)
#define PIN_RS485_DE      BOARD_RS485_DE       // net DE_RS (DE+/RE tied)

/* ---- Relay / deur / VBUS ------------------------------------------------ */
#define PIN_RELAY         17                   // TODO: confirm (net RELAY_GPIO, drives BC817 base)
#define PIN_REED_SWITCH   BOARD_DOOR_PIN       // net REED_SWITCH (al in gebruik door sensors)
#define PIN_VBUS_DETECT   13                   // TODO: confirm (net VBUS_DETECT, los van BOARD_USB_ADC_PIN)

/* ---- TPL5010 hardware watchdog ----------------------------------------- */
#define PIN_WDT_DONE      14                   // TODO: confirm (net WDT_DONE, pulse HIGH om te kicken)
/* WDT_RESET is een ingang naar EN/RST van de ESP32; niet als GPIO gedreven. */

#endif /* PINS_CARRIER_H */
