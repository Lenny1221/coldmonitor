#ifndef BOARD_PINS_H
#define BOARD_PINS_H

/**
 * Pinmapping per hardware.
 *
 * LilyGO T-SIM7670G S3: modem/reserve volgens
 * https://github.com/Xinyuan-LilyGO/LilyGo-Modem-Series (utilities.h → LILYGO_T_SIM7670G_S3
 * en LILYGO_SIM7670G_S3_STAN voor de "Standard"-PCB)
 * Product: https://lilygo.cc/products/t-sim-7670g-s3
 *
 * Build:
 *   pio run -e lilygo-t-sim7670g-s3          — klassieke pinmap (BAT=4, VIN/solar=5)
 *   pio run -e lilygo-t-sim7670g-s3-standard — Standard (BAT=8, VIN/solar=18)
 */

#if defined(BOARD_LILYGO_T_SIM7670G_S3)

#if defined(BOARD_LILYGO_T_SIM7670G_S3_STANDARD)
#define COLDMONITOR_BOARD_NAME "LilyGO T-SIM7670G S3 (Standard)"
#else
#define COLDMONITOR_BOARD_NAME "LilyGO T-SIM7670G S3"
#endif

/* Gereserveerd / modem-SD: zie LilyGO utilities voor jouw variant. Qwiic: 1=SCL, 2=SDA. */

#define BOARD_BOOT_PIN 0

/* User LED (LilyGO BOARD_LED_PIN, zie LilyGo-Modem-Series utilities.h) — active low */
#define BOARD_STATUS_LED_PIN 12
#define BOARD_LED_ACTIVE_LOW 1

/* MAX31865 SPI – 6,7,15 = SimShield-SPI datalijnen. CS: klassiek = GPIO8; Standard: GPIO8 = BAT-ADC → CS = 38 (verifieer op schematic). */
#define BOARD_MAX31865_MOSI 15
#define BOARD_MAX31865_MISO 7
#define BOARD_MAX31865_SCK 6
#if defined(BOARD_LILYGO_T_SIM7670G_S3_STANDARD)
#define BOARD_MAX31865_CS 38
#else
#define BOARD_MAX31865_CS 8
#endif

#define BOARD_DOOR_PIN 21

/* RS485 / Modbus op UART2 (Software kiest pins in main via config) */
#define BOARD_RS485_RX 33
#define BOARD_RS485_TX 34
#define BOARD_RS485_DE 35

#if defined(BOARD_LILYGO_T_SIM7670G_S3_STANDARD)
#define BOARD_BATTERY_ADC_PIN 8
#else
#define BOARD_BATTERY_ADC_PIN 4
#endif

/*
 * Geen extra draden: 18650 in houder of VBAT volgens LilyGO-manual.
 * GPIO12 = BOARD_LED_PIN alleen; geen HOLD hier.
 */

/*
 * Netvoeding: LilyGO BOARD_SOLAR_ADC_PIN — klassiek GPIO5, Standard GPIO18.
 * USB-C naar PC: deler kan ~0 V; zie power_monitor (USB-CDC + multisample).
 */
#if defined(BOARD_LILYGO_T_SIM7670G_S3_STANDARD)
#define BOARD_USB_ADC_PIN 18
#else
#define BOARD_USB_ADC_PIN 5
#endif
#define USB_CONNECTED_THRESHOLD_V 0.08f
#define USB_DISCONNECTED_THRESHOLD_V 0.04f
/** Alleen ADC onbetrouwbaar onder dit niveau; USB-CDC kan alsnog voeding signaleren. */
#define BOARD_USB_SENSE_MIN_VALID_V 0.03f
/**
 * Label voor serial/logs op GPIO5: LilyGO meet VIN/solar (utilities.h), geen USB-kabelsensor.
 * LiPo los kan dezelfde ADC doen dalen als “voeding weg”.
 */
#define BOARD_POWER_MONITOR_LOG_NAME "Externe voeding (VIN)"

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
#define BOARD_POWER_MONITOR_LOG_NAME "USB"

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
