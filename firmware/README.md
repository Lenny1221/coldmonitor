# ColdMonitor ESP32 Firmware

Production-grade ESP32 firmware for IoT refrigeration logger with PT1000 RTD temperature sensing, RS485/Modbus communication, and cloud connectivity.

---

## Configuratie, NVS keys & status (production setup)

### Boot flow (state machine)

| State | Beschrijving |
|-------|--------------|
| **BOOT** | Init brownout, Serial, LED |
| **LOAD_NVS** | Provisioning + config laden uit NVS |
| **WIFI_CONNECT** | Verbinden met opgeslagen WiFi (timeout 20s) |
| **CONFIG_PORTAL** | IntelliFrost-Setup AP als WiFi/API ontbreekt |
| **API_HANDSHAKE** | POST /devices/heartbeat → status ONLINE |
| **RUN** | Sensoren, upload, periodieke heartbeat |

### NVS keys (namespace `provision`)

| Key | Beschrijving |
|-----|--------------|
| `wifi_ssid` | WiFi SSID |
| `wifi_pass` | WiFi wachtwoord |
| `api_url` | Backend URL (vast: `https://web-production-e67f4.up.railway.app/api`) |
| `api_key` | Device API key (x-device-key) |
| `device_serial` | Serienummer (zoals in app/database) |
| `provisioned` | Boolean: configuratie compleet |

### Status richting app

- **connected_to_wifi**: `true` als WiFi verbonden
- **connected_to_api**: `true` als heartbeat succesvol
- **last_error**: Laatste fout (bijv. "API handshake failed")
- **Heartbeat**: POST `/api/devices/heartbeat` met `x-device-key`, payload: `deviceId`, `firmwareVersion`, `ip`, `rssi`, `uptime`
- **Exponentiële backoff**: Bij API-fout 60s → 120s → 240s → … tot max 10 min

### Logging

- Format: `[millis()] [LEVEL] message`
- Voorbeelden: `[00010] BOOT: ...`, `[00100] NVS: ...`, `[00500] WIFI: connected`, `[01000] API: ONLINE`
- Secrets (api_key, wifi_pass) worden nooit volledig gelogd

---

## Features

- ✅ **Deurstatus** (droog contact; GPIO zie pin-tabel per board)
- ✅ **PT1000 RTD** via MAX31865 over SPI (primaire temperatuur)
- ✅ **RS485/Modbus RTU** communication with refrigeration controllers
- ✅ **Offline Data Buffering** using SPIFFS (up to 100 readings)
- ✅ **WiFi Connectivity** with automatic reconnection
- ✅ **Battery Monitoring** with low battery protection
- ✅ **OTA Updates** for remote firmware updates
- ✅ **Power Management** with deep sleep support
- ✅ **Multi-tasking** using FreeRTOS tasks
- ✅ **Structured Logging** with configurable levels
- ✅ **Configuration Management** with persistent storage

## Hardware Requirements

### ESP32 Development Board
- ESP32-WROOM-32 or compatible
- Minimum 4MB Flash
- PSRAM recommended

### MAX31865 RTD-to-Digital Converter (Adafruit library)
- SPI interface, PT1000 (2-wire)
- PT1000 op F+/F- (of R1/R2), 4.3kΩ referentieweerstand tussen Rref+/Rref-

### RS485 Module (Optional)
- MAX485 or similar RS485 transceiver
- DE/RE control pins

### Power
- 3.3V power supply
- Battery monitoring via voltage divider on ADC pin 34

## Pin Configuration

### LilyGO T-SIM7670G S3 ([productpagina](https://lilygo.cc/products/t-sim-7670g-s3), [modem-voorbeelden / pindefs](https://github.com/Xinyuan-LilyGO/LilyGo-Modem-Series))

**Build:** `pio run -e lilygo-t-sim7670g-s3` (of `-e lilygo-t-sim7670g-s3-release`).  
Board-target: `esp32-s3-devkitc-1` met `qio_opi` PSRAM (pas aan als upload of boot faalt op jouw revisie).

**Let op:** De firmware gebruikt **WiFi** zoals op de klassieke ESP32. **4G (SIM7670)** is **niet** in deze codebase gekoppeld (geen PPP/data via modem). Modem-pinnen blijven ongemoeid zolang je geen LTE-stack toevoegt.

**LED (GPIO 12):** User-LED zoals LilyGO `BOARD_LED_PIN`; *active low.* Batterij-ADC gebruikt alleen **GPIO 4** (zoals LilyGo ReadBattery: `analogReadMilliVolts` × 2), **zonder** aparte enable-pin op 12.

**Niet gebruiken voor eigen sensoren** (gereserveerd door board/modem/SD): o.a. **1, 2** (Qwiic / shield), **3, 4, 5, 9, 10, 11, 12, 13, 14, 17, 18, 21, 47** — zie LilyGO `utilities.h` (`LILYGO_T_SIM7670G_S3`).

| Functie | GPIO | Aansluiting |
|--------|------|-------------|
| **Factory reset** | **0** | BOOT-knop (3 s bij start) |
| **Status-LED** | **12** | Onboard user-LED (active low; heartbeat + reset-feedback) |
| **MAX31865 SCK** | **6** | SPI klok |
| **MAX31865 MISO** | **7** | SPI MISO |
| **MAX31865 CS** | **8** | Chip select |
| **MAX31865 MOSI** | **15** | SPI MOSI |
| **Deur** (INPUT_PULLUP) | **21** | Schakelaar naar GND (pin **21** op linkerheader; niet combineren met actief TF/SD-SPI) |
| **RS485 RO → RX** | **33** | UART2 RX |
| **RS485 DI ← TX** | **34** | UART2 TX |
| **RS485 DE + RE** | **35** | Driver enable |
| **Batterijspanning** | **4** (ADC) | **Geen extra draden:** 18650 in houder / VBAT. GPIO **4** = ADC (deler ×2). Serial logt ruwe ADC mV bij lage spanning. **T-SIM7670G-S3-Standard** gebruikt GPIO **8** — andere pinmap. |
| **Externe voeding (VIN)** | **5** (ADC) | **Geen USB-kabelsensor:** intern LilyGO-net (`BOARD_SOLAR_ADC_PIN`, geschaalde VIN). Loskoppelen LiPo kan hetzelfde signaal beïnvloeden als adapter weg. `powerStatus` / opladen-heuristiek. **Drempels** in `board_pins.h`; Serial toont `Externe voeding (VIN)`. |

**ESP32 DevKit:** USB-detectie blijft op **GPIO 35** (eigen spanningsdeler op dat board).

---

### Sensoren (deurstatus) — ESP32 DevKit (klassiek)

| Sensor | Verbinding | ESP32 GPIO |
|--------|------------|------------|
| **Deurstatus** (droog contact) | COM → GND | - |
| | NO (normally open) → **GPIO 32** | INPUT_PULLUP |

**Deurstatus:**
- Juiste aansluiting: één draad schakelaar → GPIO 32, andere draad → GND (niet 3V3).
- Contact gesloten (deur dicht) → GPIO leest **LOW**
- Contact open (deur open) → GPIO leest **HIGH**. In Serial Monitor: pin=0 of pin=1. Melding verkeerd om? In sensors.h: PIN_DOOR_INVERTED 1
- Tip: NC (normally closed) is fail-safe: kabelbreuk = “deur open” alarm

**Real-time deur-events:** Debounce 50 ms, direct event naar backend bij state change. Offline queue (32 events), rate limit 5/s.

### SPI (MAX31865) – primaire temperatuursensor
- **CS**: GPIO 5 | **MOSI**: GPIO 23 | **MISO**: GPIO 19 | **SCK**: GPIO 18

### RS485 (Optional)
- **RO** (Receiver Output → ESP32 RX): GPIO 16
- **DI** (Driver Input ← ESP32 TX): GPIO 17
- **DE & RE** (same pin): GPIO 4

### Battery Monitoring
- **ADC**: GPIO 34 (input only)

## Installation

### Prerequisites

1. **PlatformIO IDE** or **VS Code with PlatformIO extension**
2. **ESP32 Board Support** installed

### Setup

1. **Clone repository**:
   ```bash
   cd firmware
   ```

2. **Install dependencies**:
   ```bash
   pio lib install
   ```

3. **Configure settings**:
   - Edit `src/config.h` for default values
   - Or configure via WiFi Manager portal on first boot

4. **Build and upload**:
   ```bash
   pio run -t upload
   ```
   
   **Upload faalt met "Failed to connect"?** PlatformIO kan Bluetooth kiezen i.p.v. USB:
   - Sluit de ESP32 aan via een **USB-data kabel** (geen oplaad-only)
   - Run `pio device list` en zoek de poort (bijv. `/dev/cu.usbserial-0001` of `/dev/cu.wchusbserial*`)
   - Voeg in `platformio.ini` toe: `upload_port = /dev/cu.usbserial-0001` (pas aan)
   - Of upload via `pio run -t upload --upload-port /dev/cu.usbserial-0001`
   - Hou de **BOOT**-knop ingedrukt tijdens "Connecting..." indien nodig

5. **Monitor serial output**:
   ```bash
   pio device monitor
   ```

## Configuration

### First Boot

On first boot, the device creates a WiFi access point:
- **SSID**: `IntelliFrost-Setup`
- **Password**: (none, or check serial output)

Connect to this AP and configure:
- WiFi credentials
- API key
- Device serial number
- Reading intervals
- Modbus settings (if enabled)

### WiFi resetten (opgeslagen netwerk wissen)

Om opnieuw een WiFi-netwerk te kiezen (bijv. ander netwerk of nieuw wachtwoord):

**BELANGRIJK:** Gebruik de **BOOT-knop** (GPIO 0), **NIET** de RESET-knop!

- **BOOT-knop** (GPIO 0): Meestal naast de USB-poort, kan gelezen worden door de firmware
- **RESET-knop**: Reset alleen de chip, kan niet gelezen worden

**Stappen:**

1. **Druk kort op RESET** (of koppel USB los en weer aan) om de ESP32 te resetten
2. **Houd direct daarna de BOOT-knop (GPIO 0) 3 seconden ingedrukt** tijdens het opstarten
3. De **LED knippert** elke 200ms terwijl je de knop indrukt (visuele feedback)
4. Na 3 seconden knippert de LED **5x snel** als bevestiging
5. In de Serial Monitor zie je: `BOOT 3 s ingedrukt - WiFi-gegevens WISSEN` en daarna `WiFi gewist. Herstart over 2 s.`
6. De ESP32 herstart automatisch en opent het config-portal (**IntelliFrost-Setup**). Verbind met dat netwerk en kies opnieuw je WiFi + wachtwoord.

**Let op:** 
- Alleen de **WiFi-gegevens** (SSID/wachtwoord) worden gewist. API key en serienummer blijven bewaard (in de ColdMonitor-config).
- Als je de knop loslaat vóór 3 seconden, wordt de reset geannuleerd en gaat de ESP32 normaal verder.

### Configuratie met QR-code (telefoon)

Op de configuratiepagina (wanneer je verbonden bent met **IntelliFrost-Setup**) staat een **QR-code**. Scan die met je telefoon om:
1. Automatisch te verbinden met het netwerk **IntelliFrost-Setup**
2. De configuratiepagina te openen (API key en serienummer staan al ingevuld)

Je hoeft dan alleen nog je **WiFi-netwerk** te kiezen en het **wachtwoord** in te voeren.

In de ColdMonitor-app (bij “Logger toevoegen”) kun je ook twee QR-codes tonen: de eerste om te verbinden met IntelliFrost-Setup, de tweede om de configpagina te openen met API-gegevens al ingevuld.

### Configuration Parameters

- **Device Serial**: Unique identifier for the device
- **Reading Interval**: Seconds between temperature readings (default: 20s)
- **Upload Interval**: Seconds between data uploads (default: 20s, elke lezing naar Supabase)
- **API URL**: Vast ingesteld (niet configureerbaar)
- **API Key**: Device authentication key
- **Modbus Enabled**: Enable/disable RS485 communication
- **Deep Sleep**: Enable power-saving deep sleep mode

## Usage

### Temperature Reading

The firmware automatically reads temperature from the PT1000 sensor via MAX31865 at configured intervals. Readings are:
- Validated for sensor faults
- Timestamped
- Buffered locally
- Uploaded when WiFi is available

### Modbus Communication

If enabled, the firmware can:
- Read holding registers from refrigeration controller
- Read setpoints, current temperature, compressor status
- Optionally write setpoints (if write enabled)

### Data Upload

Readings are automatically uploaded to the backend API when:
- WiFi is connected
- Upload interval elapsed
- Buffer contains data

Format:
```json
{
  "deviceId": "ESP32-XXXXXX",
  "temperature": 4.5,
  "doorStatus": false,
  "powerStatus": true,
  "batteryLevel": 85,
  "batteryVoltage": 3.8,
  "batteryCharging": false,
  "timestamp": 1234567890
}
```

### Battery Management

- Monitors battery voltage via ADC
- Calculates percentage (0-100%)
- Low battery warning at 20%
- Critical battery at 10% triggers deep sleep
- Battery data included in every reading

### Power Management

- **Deep Sleep**: Entered when battery critical or configured
- **Light Sleep**: Can be used for power saving (keeps WiFi)
- **CPU Frequency**: Adjustable (80/160/240 MHz)
- **WiFi Power Save**: Can be enabled for lower power consumption

## OTA Updates

Over-the-air firmware updates are supported:

1. **ArduinoOTA**: Built-in OTA support
2. **Password Protected**: Configured in settings
3. **Progress Logging**: Update progress visible in serial monitor

To update:
- Use Arduino IDE or PlatformIO OTA tools
- Or implement custom OTA server

## Troubleshooting

### MAX31865 Not Reading

- Check SPI connections
- Verify CS pin configuration
- Check RTD sensor wiring (4-wire recommended)
- Verify reference resistor value
- Check fault status register

### WiFi Connection Issues

- Check credentials in configuration
- Verify signal strength
- Check if AP mode is accessible
- Review serial logs for errors

### Data Not Uploading

- Verify WiFi connection
- API URL staat vast in firmware (geen configuratie nodig)
- Verify API key is correct
- Check serial logs for HTTP errors
- Ensure backend is accessible

**Upload failed: -2 (send header failed)**  
De verbinding met de backend faalt vóór of tijdens het sturen van de request. Controleer:
- API URL staat vast in de firmware (`https://web-production-e67f4.up.railway.app/api`). Geen configuratie nodig.
- **Backend online**: open in de browser `https://JOUW-RAILWAY-URL/health` – moet `{"status":"ok"}` geven.
- **WiFi**: signaalsterkte en of het netwerk internet toestaat.
- **HTTPS**: als de backend alleen HTTPS accepteert, gebruik dan een URL die met `https://` begint.

### Modbus Communication Issues

- Verify RS485 wiring
- Check baud rate matches controller
- Verify slave ID
- Check DE/RE pin configuration
- Use serial monitor to debug

### Carel PJEZ (supervisie protocol)

Voor **Carel PJEZ Easy Cool** (PZD2S0P001) met het **Carel supervisie protocol** (1200 baud, 8N2):

1. Zet `carelProtocolEnabled: true` in de config (NVS). Dit kan via de Serial Monitor of door de default in `config.cpp` aan te passen.
2. Dezelfde pinnen als Modbus: RX=16, TX=17, DE=4.
3. Ondersteunde commando's vanuit de app: Defrost start/stop, temperatuur uitlezen, defrost parameters (type, interval, duur) lezen en instellen.

### RS485 hardware check (ontdooiing / Modbus)

Controleer de bekabeling als ontdooiing niet werkt:

| ESP32 pin | RS485 module | Carel regelaar |
|-----------|--------------|----------------|
| GPIO 16 (RX) | RO (Receiver Output) | — |
| GPIO 17 (TX) | DI (Driver Input) | — |
| GPIO 4 | DE + RE (zelfde pin) | — |
| A+ | A+ / D+ | A+ of D+ |
| B- | B- / D- | B- of D- |

**Let op:** A en B kunnen bij sommige modules T+ / T- heten. Haal A/B niet om – dat keert het signaal om.

- **Terminatie:** Alleen bij lange kabels (>10 m) een 120 Ω-weerstand tussen A en B.
- **Common/GND:** Soms moet GND van ESP32 en regelaar verbonden zijn; probeer bij aanhoudende problemen.
- **Slave ID:** Moet exact overeenkomen met het Modbus-adres in het Carel-menu (vaak 1).
- **Baud:** Standaard 9600; Carel pCO/pZD-modellen soms 19200. Pas `modbus.baudRate` in config aan.

### Ontdooiing werkt niet

1. **Modbus write moet aan staan** – In config: `modbus.writeEnabled = true` (standaard nu aan). Als je eerder `false` handmatig hebt gezet, schakel terug naar `true`.
2. **Regelaar-handleiding** – Het defrost-adres verschilt per merk. Firmware probeert: register 6 → coil 2 → coil 6. Als jouw regelaar een ander adres gebruikt, pas `DEFROST_REG_ADDR`/`DEFROST_COIL_ADDR` aan in `main.cpp`.
3. **Carel PZD2S0P001** – Carel Modbus-booleans beginnen vaak bij adres 2 (coil 2, 3, 4, 5…). Baud: veel Carel-modellen gebruiken 19200 8N1; firmware standaard 9600. Pas `modbus.baudRate` in config aan indien nodig.
4. **Serial Monitor** – Open Device Monitor (`pio device monitor`) en druk in de app op "Start ontdooiing". Je ziet nu **ONTDOOIING DIAGNOSTIEK** met config, TX-hexbytes en RX-resultaat. Bij `TIMEOUT: geen bytes ontvangen` → bekabeling/slave ID/baud. Bij `Modbus exception 0x02` → verkeerd adres. Zie ook sectie "RS485 hardware check" hierboven.

### Upload: "device disconnected or multiple access on port"

1. **Serial Monitor / andere poortgebruik:** Sluit alle vensters waar de Serial Monitor open staat (`pio device monitor` of PlatformIO Serial Monitor). Er mag maar één programma de USB-poort gebruiken tijdens upload.
2. **USB los en opnieuw:** Trek de ESP32 uit, wacht 5 seconden, steek weer in. Probeer daarna opnieuw te uploaden.
3. **BOOT-knop:** Start de upload. Zodra je **"Connecting...."** ziet: houd de **BOOT**-knop op de ESP32 ingedrukt tot de verbinding tot stand komt (of 2–3 seconden), laat dan los.
4. **Andere USB-poort:** Gebruik een poort direct op de Mac (geen hub) en een korte, data-capable kabel.
5. **Snelheid staat al op 115200** in `platformio.ini` voor stabielere verbinding.

### Upload: "Failed to connect to ESP32: No serial data received"

De ESP32 reageert niet tijdens de upload. Probeer in deze volgorde:

1. **BOOT-knop tijdens upload:**
   - Houd de **BOOT**-knop ingedrukt.
   - Start de upload (`pio run -t upload`).
   - Laat de BOOT-knop los zodra je **"Connecting..."** ziet (of na 2–3 seconden).

2. **RESET-knop (als aanwezig):**
   - Druk kort op **RESET** (of koppel USB los en weer aan).
   - Start direct daarna de upload.

3. **USB-kabel en poort:**
   - Gebruik een **data-capable USB-kabel** (niet alleen stroom).
   - Probeer een **andere USB-poort** (direct op de Mac, geen hub).
   - Test met een **korte kabel** (< 1 m).

4. **Poort controleren:**
   ```bash
   pio device list
   ```
   - Controleer of de ESP32 zichtbaar is (bijv. `/dev/cu.usbserial-0001`).
   - Als je meerdere poorten ziet, uncomment `upload_port` in `platformio.ini` met de juiste poort.

5. **Upload-snelheid verlagen:**
   - In `platformio.ini` staat `upload_speed = 115200`.
   - Probeer tijdelijk `921600` → `460800` → `230400` → `115200` als het blijft falen.

6. **ESP32 in downloadmodus:**
   - Houd **BOOT** ingedrukt.
   - Druk kort op **RESET** (of koppel USB los/aan) terwijl BOOT ingedrukt blijft.
   - Laat BOOT los.
   - Start direct daarna de upload.

7. **Herstart ESP32:**
   - Koppel USB los, wacht 10 seconden.
   - Steek weer in, wacht tot de ESP32 volledig opgestart is (LED knippert).
   - Probeer dan opnieuw te uploaden.

## Development

### Project Structure

```
firmware/
├── platformio.ini          # PlatformIO configuration
├── src/
│   ├── main.cpp            # Main application
│   ├── config.h/cpp        # Configuration management
│   ├── logger.h/cpp        # Logging system
│   ├── max31865_driver.h/cpp  # MAX31865 SPI driver
│   ├── rs485_modbus.h/cpp  # RS485/Modbus RTU
│   ├── data_buffer.h/cpp   # Offline data buffering
│   ├── wifi_manager.h/cpp  # WiFi management
│   ├── api_client.h/cpp    # API communication
│   ├── door_events.h/cpp   # Door event debounce + offline queue
│   ├── time_utils.h/cpp   # NTP sync + Unix timestamp voor deur-events
│   ├── battery_monitor.h/cpp # Battery monitoring
│   ├── power_manager.h/cpp  # Power management
│   └── ota_update.h/cpp    # OTA updates
└── README.md
```

### Building

```bash
# Development build
pio run

# Release build (optimized)
pio run -e esp32dev-release

# Upload
pio run -t upload

# Monitor
pio device monitor
```

### Debugging

- Serial monitor at 115200 baud
- Log levels configurable in `logger.h`
- Use `logger.debug()` for detailed information
- Check task stack usage if crashes occur

## API Integration

The firmware uploads to:
```
POST /api/readings/devices/{serialNumber}/readings
Headers:
  Content-Type: application/json
  x-device-key: {apiKey}
Body:
  {
    "deviceId": "...",
    "temperature": 4.5,
    "timestamp": 1234567890,
    "sensorId": 0,
    "batteryLevel": 85,
    "batteryVoltage": 3.8
  }
```

## License

ISC

## Support

For issues or questions, check:
- Serial monitor logs
- Configuration settings
- Hardware connections
- Backend API status

---

**Built for ColdMonitor IoT Refrigeration Monitoring Platform**
