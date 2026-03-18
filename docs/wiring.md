# RS485 Aansluitschema per regelaartype

Overzicht van de bekabeling tussen de MAX485 module en de verschillende ondersteunde regelaars.

## Algemene MAX485 module

| MAX485 pin | Functie | Aansluiting |
|------------|---------|-------------|
| A+ / A    | Data+   | Naar regelaar A+ / RS485+ |
| B- / B    | Data-   | Naar regelaar B- / RS485- |
| GND       | Aarde   | Gemeenschappelijke GND met regelaar (indien nodig) |
| VCC       | 5V/3.3V | Voeding (ESP32: 3.3V) |
| DE + RE   | Zend/ontvang | Samen naar GPIO 4 (DE & RE gekoppeld) |
| RO        | Receiver Out | Naar ESP32 GPIO 16 (RX) |
| DI        | Driver In    | Van ESP32 GPIO 17 (TX) |

---

## Carel PJEZ Easy Cool (supervisieprotocol)

| Parameter | Waarde |
|-----------|--------|
| Protocol | Carel supervisie (1200 8N2) |
| Baudrate | 1200 |
| Slave-adres | 1 (standaard) |
| Terminator | 120 Ω tussen A en B (indien lange kabel) |

**Aansluiting op regelaar:**
- Regelaar **A+** of **RS485+** → MAX485 **A+**
- Regelaar **B-** of **RS485-** → MAX485 **B-**
- GND: verbind indien beschikbaar (niet altijd nodig)

**Regelaar-instellingen:**
- Communicatie: RS485 / Supervisie
- Baudrate: 1200
- Adres: 1

---

## Carel IR33 (Modbus)

| Parameter | Waarde |
|-----------|--------|
| Protocol | Modbus RTU |
| Baudrate | 9600 (of 19200 – zie handleiding) |
| Slave-adres | 1 |
| Pariteit | Geen (8N1) |

**Aansluiting:**
- Regelaar **A** → MAX485 **A+**
- Regelaar **B** → MAX485 **B-**
- GND: verbinden indien terminal beschikbaar

**Regelaar-instellingen:**
- Modbus RTU inschakelen
- Baudrate: 9600 of 19200
- Slave ID: 1

**Registers (referentie):**
- Setpoint: holding register 1
- Temperatuur: input register 2
- Alarm: registers 6, 7
- Aan/uit: register 101

---

## Dixell XR60C / XR70C

| Parameter | Waarde |
|-----------|--------|
| Protocol | Modbus RTU |
| Baudrate | 9600 |
| Slave-adres | 1 |

**Aansluiting:**
- Regelaar **A+** → MAX485 **A+**
- Regelaar **B-** → MAX485 **B-**

**Regelaar-instellingen:**
- RS485/Modbus inschakelen in menu
- Baudrate: 9600
- Adres: 1

**Registers/coils:**
- Temperatuur: 0x0000 (input)
- Setpoint: 0x0001 (holding)
- Defrost start: coil 0x0001
- Alarm reset: coil 0x0003

---

## Eliwell IC900 / EWPC

| Parameter | Waarde |
|-----------|--------|
| Protocol | Modbus RTU |
| Baudrate | 9600 |
| Slave-adres | 1 |

**Aansluiting:**
- Regelaar **RS485+** → MAX485 **A+**
- Regelaar **RS485-** → MAX485 **B-**

**Regelaar-instellingen:**
- Modbus in menu inschakelen
- Baudrate: 9600
- Slave ID: 1

**Registers/coils:**
- Temperatuur: 0x0100
- Setpoint: 0x0101
- Defrost: coil 0x0000
- Alarm reset: coil 0x0001

---

## Generieke Modbus

Voor onbekende regelaars:
1. Raadpleeg de handleiding voor RS485/Modbus aansluiting
2. Noteer baudrate, slave-adres en pariteit
3. Stel in de IntelliFrost app het regelaartype in op "Generieke Modbus"
4. Gebruik handmatig register/coil lezen en schrijven om adressen te bepalen

---

## Terminatorweerstand

Bij kabellengte > 10 m of bij meerdere devices op de bus:
- Plaats 120 Ω tussen A+ en B- aan het einde van de bus
- Meestal niet nodig bij korte kabel (1–3 m) en één regelaar

---

## Troubleshooting

| Probleem | Mogelijke oorzaak |
|----------|-------------------|
| Geen antwoord (timeout) | A en B omgewisseld; verkeerd slave-adres; verkeerde baudrate |
| Modbus exception 0x02 | Verkeerd register- of coiladres |
| CRC error | Storing op de lijn; te lange kabel zonder terminator |
| Onjuiste waarden | Verkeerde bytevolgorde (big-endian vs little-endian) |
