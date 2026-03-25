#ifndef BOARD_PINS_H
#define BOARD_PINS_H

/**
 * Pinmapping per hardware.
 *
 * LilyGO T-SIM7670G S3: modem/reserve volgens
 * https://github.com/Xinyuan-LilyGO/LilyGo-Modem-Series (utilities.h → LILYGO_T_SIM7670G_S3)
 * Product: https://lilygo.cc/products/t-sim-7670g-s3
 *
 * Build: pio run -e lilygo-t-sim7670g-s3  (zet -DBOARD_LILYGO_T_SIM7670G_S3)
 */

#if defined(BOARD_LILYGO_T_SIM7670G_S3)

#define COLDMONITOR_BOARD_NAME "LilyGO T-SIM7670G S3"

/* Gereserveerd op het board (niet gebruiken): 3,4,5,9,10,11,12,13,14,17,18,21,47
   + Qwiic/shield I²C: 1=SCL, 2=SDA (LilyGO utilities.h) */

#define BOARD_BOOT_PIN 0

/* User LED (LilyGO BOARD_LED_PIN, zie LilyGo-Modem-Series utilities.h) — active low */
#define BOARD_STATUS_LED_PIN 12
#define BOARD_LED_ACTIVE_LOW 1

/* MAX31865 SPI – pins 6,7,15 zijn op het board als SimShield-SPI gelabeld;
   zonder SimShield vrije GPIO. Niet de SD-SPI (13,14,21,47) gebruiken. */
#define BOARD_MAX31865_CS 8
#define BOARD_MAX31865_MOSI 15
#define BOARD_MAX31865_MISO 7
#define BOARD_MAX31865_SCK 6

#define BOARD_DOOR_PIN 21

/* RS485 / Modbus op UART2 (Software kiest pins in main via config) */
#define BOARD_RS485_RX 33
#define BOARD_RS485_TX 34
#define BOARD_RS485_DE 35

/* LilyGO onboard batterij-ADC (BOARD_BAT_ADC_PIN in utilities.h = 4) */
#define BOARD_BATTERY_ADC_PIN 4

/*
 * Pinout (T-SIM7670G S3): ADC op GPIO4; GPIO12 deelt met user-LED en schakelt de
 * meetketen aan (HIGH = actief, zie LilyGO-diagram). Tijdens sampling kort LED uit.
 */
#define BOARD_BATTERY_ADC_HOLD_PIN 12
#define BOARD_BATTERY_ADC_HOLD_LEVEL HIGH

/*
 * Netvoeding / USB: LilyGO utilities.h → BOARD_SOLAR_ADC_PIN (5). Geschaalde VIN/USB.
 * - USB-C naar PC: divider staat soms ~0 V → geen betrouwbare "stroom actief"-bit; zie main.cpp.
 * - Netadapter op VIN: vaak wel spanning op GPIO5; lagere drempels vangen zwakke delers.
 */
#define BOARD_USB_ADC_PIN 5
#define USB_CONNECTED_THRESHOLD_V 0.22f
#define USB_DISCONNECTED_THRESHOLD_V 0.10f
/** Onder deze ADC-spanning (V) is de meetketen als onbetrouwbaar beschouwd (geen powerStatus in API). */
#define BOARD_USB_SENSE_MIN_VALID_V 0.05f

#else /* Standaard ESP32 DevKit (historisch) */

#define COLDMONITOR_BOARD_NAME "ESP32 DevKit"

#define BOARD_BOOT_PIN 0

#ifdef LED_BUILTIN
#define BOARD_STATUS_LED_PIN LED_BUILTIN
#else
#define BOARD_STATUS_LED_PIN 2
#endif

#undef BOARD_LED_ACTIVE_LOW

#define BOARD_MAX31865_CS 5
#define BOARD_MAX31865_MOSI 23
#define BOARD_MAX31865_MISO 19
#define BOARD_MAX31865_SCK 18

#define BOARD_DOOR_PIN 32

#define BOARD_RS485_RX 16
#define BOARD_RS485_TX 17
#define BOARD_RS485_DE 4

#define BOARD_BATTERY_ADC_PIN 34

#undef BOARD_POWER_MONITOR_DISABLED

#endif

/* Zichtbaar AAN / UIT (rekening houdend met active-low boards zoals LilyGO GPIO12) */
#if defined(BOARD_LED_ACTIVE_LOW) && BOARD_LED_ACTIVE_LOW
#define BOARD_LED_LEVEL_ON LOW
#define BOARD_LED_LEVEL_OFF HIGH
#else
#define BOARD_LED_LEVEL_ON HIGH
#define BOARD_LED_LEVEL_OFF LOW
#endif

#define BOARD_LED_TOGGLE(p) \
  digitalWrite((p), (digitalRead((p)) == BOARD_LED_LEVEL_ON) ? BOARD_LED_LEVEL_OFF : BOARD_LED_LEVEL_ON)

#endif
