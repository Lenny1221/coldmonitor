# ColdMonitor ESP32 Firmware

Production-grade ESP32 firmware for IoT refrigeration logger with PT1000 RTD temperature sensing, RS485/Modbus communication, and cloud connectivity.

## Features

- ✅ **BMP180** (I²C) temperatuur + luchtdruk
- ✅ **DHT11** temperatuur + luchtvochtigheid
- ✅ **Deurstatus** (droog contact, GPIO 25)
- ✅ **PT1000 RTD** (optioneel) via MAX31865 over SPI
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

### MAX31865 RTD-to-Digital Converter
- SPI interface
- PT1000 RTD sensor (4-wire recommended)
- Reference resistor: 4.3kΩ

### RS485 Module (Optional)
- MAX485 or similar RS485 transceiver
- DE/RE control pins

### Power
- 3.3V power supply
- Battery monitoring via voltage divider on ADC pin 34

## Pin Configuration

### Sensoren (BMP180 + DHT11 + deurstatus)

| Sensor | Verbinding | ESP32 GPIO |
|--------|------------|------------|
| **BMP180** (I²C) | VCC → 3V3 | - |
| | GND → GND | - |
| | SCL → **GPIO 22** | SCL |
| | SDA → **GPIO 21** | SDA |
| **DHT11** (digital) | VCC → 3V3 | - |
| | GND → GND | - |
| | DATA → **GPIO 27** | DATA (10kΩ pull-up naar 3V3 indien niet onboard) |
| **Deurstatus** (droog contact) | COM → GND | - |
| | NO (normally open) → **GPIO 25** | INPUT_PULLUP |

**Deurstatus:**
- Juiste aansluiting: één draad schakelaar → GPIO 25, andere draad → GND (niet 3V3).
- Contact gesloten (deur dicht) → GPIO leest **LOW**
- Contact open (deur open) → GPIO leest **HIGH**. In Serial Monitor: pin=0 of pin=1. Melding verkeerd om? In sensors.h: PIN_DOOR_INVERTED 1
- Tip: NC (normally closed) is fail-safe: kabelbreuk = “deur open” alarm

### SPI (MAX31865) – optioneel
- **CS Pin**: GPIO 5 (configurable)
- **MOSI**: GPIO 23 (SPI default)
- **MISO**: GPIO 19 (SPI default)
- **SCK**: GPIO 18 (SPI default)

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
- **SSID**: `ColdMonitor-Setup`
- **Password**: (none, or check serial output)

Connect to this AP and configure:
- WiFi credentials
- API URL
- Device serial number
- Reading intervals
- Modbus settings (if enabled)

### Configuratie met QR-code (telefoon)

Op de configuratiepagina (wanneer je verbonden bent met **ColdMonitor-Setup**) staat een **QR-code**. Scan die met je telefoon om:
1. Automatisch te verbinden met het netwerk **ColdMonitor-Setup**
2. De configuratiepagina te openen (API URL en API key staan al ingevuld)

Je hoeft dan alleen nog je **WiFi-netwerk** te kiezen en het **wachtwoord** in te voeren.

In de ColdMonitor-app (bij “Logger toevoegen”) kun je ook twee QR-codes tonen: de eerste om te verbinden met ColdMonitor-Setup, de tweede om de configpagina te openen met API-gegevens al ingevuld.

### Configuration Parameters

- **Device Serial**: Unique identifier for the device
- **Reading Interval**: Seconds between temperature readings (default: 60s)
- **Upload Interval**: Seconds between data uploads (default: 300s)
- **API URL**: Backend API endpoint
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
  "humidity": 65.2,
  "doorStatus": false,
  "powerStatus": true,
  "batteryLevel": 85,
  "batteryVoltage": 3.8,
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
- Check API URL configuration
- Verify API key is correct
- Check serial logs for HTTP errors
- Ensure backend is accessible

### Modbus Communication Issues

- Verify RS485 wiring
- Check baud rate matches controller
- Verify slave ID
- Check DE/RE pin configuration
- Use serial monitor to debug

### Upload: "device disconnected or multiple access on port"

1. **Serial Monitor / andere poortgebruik:** Sluit alle vensters waar de Serial Monitor open staat (`pio device monitor` of PlatformIO Serial Monitor). Er mag maar één programma de USB-poort gebruiken tijdens upload.
2. **USB los en opnieuw:** Trek de ESP32 uit, wacht 5 seconden, steek weer in. Probeer daarna opnieuw te uploaden.
3. **BOOT-knop:** Start de upload. Zodra je **"Connecting...."** ziet: houd de **BOOT**-knop op de ESP32 ingedrukt tot de verbinding tot stand komt (of 2–3 seconden), laat dan los.
4. **Andere USB-poort:** Gebruik een poort direct op de Mac (geen hub) en een korte, data-capable kabel.
5. **Snelheid staat al op 115200** in `platformio.ini` voor stabielere verbinding.

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
