#ifndef PINS_CARRIER_H
#define PINS_CARRIER_H

/**
 * Carrier-PCB v1.1 — LilyGO T-SIM7670G-S3 ↔ carrier peripherals
 *
 * Officiële pin-tabel (U6 linker 16p + U7 rechter 16p).
 *
 * U6 (linker header):
 *   1  VBAT                 →  boost U14
 *   2  GPIO21   SPI_SCK     →  U3/U4 pin 12
 *   3  GPIO14   SPI_MOSI    →  U3/U4 pin 11
 *   4  GPIO13   CS_U3       →  U3 pin 13   (sensor 2 / verdamper)
 *   5  GPIO12   ⛔ niet gebruiken (LilyGO charge-LED)
 *   6  GPIO46   spare (strap — laat open / pulldown)
 *   7  GPIO8    RELAY_GPIO  →  Q1 basis via R20
 *   8  GPIO16   spare
 *   9  GPIO15   spare       (was per oude tabel CS_U4, maar PCB v1.1 wired CS_U4 op GPIO48)
 *  10  GPIO7    spare
 *  11  GPIO6    spare
 *  12  GPIO5    WDT_DONE    →  TPL5010 pin 5
 *  13  GPIO4    ⛔ niet gebruiken (LilyGO BAT_ADC)
 *  14  RST      WDT_RESET   →  TPL5010 pin 6 + reset-knop
 *  15  GND
 *  16  3V3
 *
 * U7 (rechter header):
 *   1  GPIO43   spare / debug TXD
 *   2  GPIO44   spare / debug RXD
 *   3  3V3
 *   4  GND
 *   5  GPIO1    VBUS_DETECT →  USB-C deler
 *   6  GPIO2    REED_SWITCH →  P5 via R22
 *   7  GPIO42   spare
 *   8  GPIO41   spare
 *   9  GPIO40   RS485_DE    →  MAX3485 pin 2+3 (RE#/DE)
 *  10  GPIO39   RS485_RX    →  MAX3485 pin 1 (RO)
 *  11  GPIO38   RS485_TX    →  MAX3485 pin 4 (DI)
 *  12  GPIO0    ⛔ niet aansluiten (BOOT-strap)
 *  13  GPIO48   CS_U4       →  U4 pin 13   (sensor 1 / ruimte)  [PCB v1.1, niet GPIO15]
 *  14  GPIO47   SPI_MISO    →  U3/U4 pin 14
 *  15  GND
 *  16  VIN (+5V rail van USB-C + boost)
 *
 * MAX31865 (Sheet_3): U4 = CS-1 (ruimte, idx 0), U3 = CS-2 (verdamper, idx 1).
 */

/* ---- SPI bus (gedeeld door beide MAX31865) ----------------------------- */
#define PIN_SPI_SCK       21   /* U6-2  SCLK     */
#define PIN_SPI_MOSI      14   /* U6-3  MOSI/SDI */
#define PIN_SPI_MISO      47   /* U7-14 MISO/SDO */
#define PIN_MAX31865_CS1  48   /* U7-13 CS_U4    (sensor 1 / ruimte)     */
#define PIN_MAX31865_CS2  13   /* U6-4  CS_U3    (sensor 2 / verdamper)  */

/* ---- RS485 (MAX3485, half-duplex) -------------------------------------- */
#define PIN_RS485_TX      38   /* U7-11 → MAX3485 DI */
#define PIN_RS485_RX      39   /* U7-10 → MAX3485 RO */
#define PIN_RS485_DE      40   /* U7-9  → DE + /RE   */

/* ---- Relais, deur, VBUS ------------------------------------------------ */
#define PIN_RELAY          8   /* U6-7  → BC817 basis via 1kΩ */
#define PIN_REED_SWITCH    2   /* U7-6  → reed-contact */
#define PIN_VBUS_DETECT    1   /* U7-5  → VBUS-deler (HIGH = USB-C aanwezig) */

/* ---- TPL5010 hardware-watchdog ---------------------------------------- */
#define PIN_WDT_DONE       5   /* U6-12 → TPL5010 DONE (pulse HIGH) */
/* WDT_RESET is gewired naar ESP32 RST (U6-14). Geen GPIO. */

#endif /* PINS_CARRIER_H */
