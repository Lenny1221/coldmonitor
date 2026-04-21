#ifndef PINS_CARRIER_H
#define PINS_CARRIER_H

/**
 * Carrier-PCB v1.1 (JLCPCB) — LilyGO T-SIM7670G-S3 ↔ carrier peripherals
 *
 * BRON: Altium Designer schematic (Sheet_1.schdoc, dd. 2026-04-11) van de
 * carrier-ontwerper. De mapping hieronder is afgeleid door elk net-label op
 * Sheet_1 te matchen met de LilyGO-module-pin op dezelfde wire (zie de U7/U6
 * PM254-connectoren en de T-SIM7670G-S3 symbol). Deze file is sindsdien leidend;
 * de oudere `board_pins.h` beschrijft de LilyGO zonder carrier en mag NIET
 * gebruikt worden voor carrier-specifieke nets.
 *
 * Schematic ↔ GPIO (bevestigd):
 *   SCLK        → GPIO 21    (LilyGO header pin 15)
 *   SDI_MOSI    → GPIO 14    (pin 14)
 *   SD0_MISO    → GPIO 47    (pin 19)
 *   CS-1        → GPIO 48    (pin 20)
 *   CS-2        → GPIO 13    (pin 13)
 *   TX_RS       → GPIO 43    (pin 32, header-label "TXD" = U0TXD)
 *   RX_RS       → GPIO 44    (pin 31, header-label "RXD" = U0RXD)
 *   DE_RS       → GPIO  2    (pin 27)
 *   RELAY_GPIO  → GPIO  8    (pin 10, drives BC817 basis)
 *   REED_SWITCH → GPIO 46    (pin 11)
 *   VBUS_DETECT → GPIO 12    (pin 12)   ⚠ conflict — zie hieronder
 *   WDT_DONE    → GPIO  4    (pin 4)    ⚠ conflict — zie hieronder
 *   WDT_RESET   → ESP32 EN/RST           (hardware-reset, geen GPIO)
 *
 * HARDWARE-CONFLICTEN met de niet-carrier firmware-config (moeten in code
 * afgevangen worden op carrier-builds):
 *   - GPIO 12 op de carrier = VBUS_DETECT (INPUT). In `board_pins.h` is dit
 *     ook BOARD_STATUS_LED_PIN (charge-LED). De LED-driver moet uit staan.
 *   - GPIO  4 op de carrier = WDT_DONE (OUTPUT puls). In `board_pins.h` is dit
 *     BOARD_BATTERY_ADC_PIN op de klassieke LilyGO. Battery-ADC moet uit.
 *   - GPIO 21 op de carrier = SPI SCLK. In `board_pins.h` was dit BOARD_DOOR_PIN.
 *     Op de carrier zit de reed switch op GPIO 46 (REED_SWITCH).
 *   - GPIO 43/44 op de carrier = RS485 (UART0). Vrij op T-SIM7670G-S3 omdat
 *     de console via native USB-CDC (GPIO 19/20) loopt. Geen seriële debug
 *     output op UART0 zodra RS485 actief is.
 */

/* ---- SPI bus (gedeeld door beide MAX31865) ----------------------------- */
#define PIN_SPI_SCK       21   /* net SCLK      */
#define PIN_SPI_MOSI      14   /* net SDI_MOSI  */
#define PIN_SPI_MISO      47   /* net SD0_MISO  */
#define PIN_MAX31865_CS1  48   /* net CS-1  → sensor 1 */
#define PIN_MAX31865_CS2  13   /* net CS-2  → sensor 2 */

/* ---- RS485 (MAX3485, half-duplex) -------------------------------------- */
#define PIN_RS485_TX      43   /* net TX_RS → MAX3485 DI  (U0TXD) */
#define PIN_RS485_RX      44   /* net RX_RS → MAX3485 RO  (U0RXD) */
#define PIN_RS485_DE       2   /* net DE_RS → DE + /RE gekoppeld */

/* ---- Relais, deur, VBUS ------------------------------------------------ */
#define PIN_RELAY          8   /* net RELAY_GPIO → BC817 basis (1 kΩ)          */
#define PIN_REED_SWITCH   46   /* net REED_SWITCH (RC-debounce op de carrier)  */
#define PIN_VBUS_DETECT   12   /* net VBUS_DETECT (BAT54 + deler) — conflict 12*/

/* ---- TPL5010 hardware-watchdog ---------------------------------------- */
#define PIN_WDT_DONE       4   /* net WDT_DONE  — pulse HIGH om te kicken, conflict 4 */
/* WDT_RESET is gewired naar ESP32 EN/RST. Niet als GPIO configureren. */

#endif /* PINS_CARRIER_H */
