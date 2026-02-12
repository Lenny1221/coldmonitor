# Production-Grade ESP32 Provisioning System

## Overzicht

Deze firmware implementeert een production-grade provisioning systeem voor de ESP32-WROOM-32 DevKit met first-boot detectie, persistente opslag, en factory reset functionaliteit.

## Features

- ✅ **First-boot detectie**: Detecteert automatisch eerste opstart en start config portal
- ✅ **Persistente opslag**: WiFi en API credentials worden opgeslagen in NVS flash geheugen
- ✅ **Factory reset**: Reset knop (GPIO 0) 3 seconden ingedrukt = wis alle instellingen
- ✅ **Security**: Secrets worden gemaskeerd in logs (alleen laatste 4 tekens zichtbaar)
- ✅ **Duidelijke logging**: Alle belangrijke stappen worden gelogd met timestamps
- ✅ **Edge cases**: Handelt ontbrekende configuratie, WiFi falen, etc. af

## Boot Flow

1. **Boot** → Laad settings uit NVS
2. **Reset check** → Controleer reset knop (3s hold = factory reset)
3. **Provisioning check** → Als niet provisioned → Start config portal direct
4. **WiFi connect** → Als provisioned → Probeer WiFi connect met timeout (20s)
5. **Portal fallback** → Bij falen → Start config portal voor reconfiguratie
6. **Save & restart** → Na portal submit → Sla alles op in NVS en herstart

## Reset Knop

- **GPIO**: GPIO 0 (BOOT button op ESP32 DevKit)
- **Actie**: Houd 3 seconden ingedrukt voor factory reset
- **Gedrag**: 
  - LED knippert tijdens indrukken
  - Na 3 seconden: wis alle instellingen en herstart
  - Loslaten voor 3 seconden: annuleer reset

## NVS Opslag Structuur

```
Namespace: "provision"
Keys:
  - wifi_ssid: WiFi SSID (max 32 chars)
  - wifi_pass: WiFi password (max 64 chars)
  - api_url: Backend API URL (max 256 chars)
  - api_key: API authentication key (max 128 chars)
  - provisioned: Boolean flag (0/1)
```

**Belangrijk**: 
- Opgeslagen in flash geheugen (NVS)
- Blijft bewaard over power cycles
- Flash heeft eindige write cycles - schrijf enkel bij wijzigingen

## Config Portal

Wanneer het config portal wordt gestart:

1. **AP SSID**: `ColdMonitor-Setup`
2. **IP**: `192.168.4.1`
3. **Velden**:
   - WiFi SSID
   - WiFi Password
   - API URL
   - API Key
   - Device Serial Number

Na het invullen en opslaan:
- Alle instellingen worden opgeslagen in NVS
- Device wordt gemarkeerd als "provisioned"
- Device herstart automatisch
- Na herstart verbindt device automatisch met opgeslagen WiFi

## Logging Format

Alle logs gebruiken het volgende format:
```
[timestamp] [LEVEL] Message
```

Voorbeelden:
```
[01234] [INFO] === ColdMonitor ESP32 Firmware ===
[01240] [INFO] PROVISIONING: NVS geladen in 15ms
[01245] [WARN] EERSTE BOOT: Configuratie vereist
[01250] [INFO] PORTAL: Config portal starten...
[01255] [INFO] PORTAL: AP SSID = ColdMonitor-Setup
[01260] [INFO] PORTAL: Open http://192.168.4.1 in browser
```

## Security

- **Secrets worden gemaskeerd**: WiFi passwords en API keys worden niet volledig getoond in logs
- **Format**: `****ABCD` (laatste 4 tekens zichtbaar)
- **Voorbeeld**: `PROVISIONING: API Key = ****abcd`

## Edge Cases

### Ontbrekende API configuratie
- Als WiFi bestaat maar API config ontbreekt → Forceer config portal
- Log expliciet waarom portal wordt gestart

### WiFi connect faalt
- Timeout na 20 seconden
- Start config portal voor reconfiguratie
- Log status elke ~1 seconde tijdens connect

### WiFi SSID verandert
- Detecteer netwerk wijziging
- Log nieuwe SSID
- Gebruik opgeslagen credentials voor nieuwe SSID

## Gebruik

### Eerste Setup

1. Upload firmware naar ESP32
2. ESP32 start automatisch config portal (eerste boot)
3. Verbind met WiFi netwerk `ColdMonitor-Setup`
4. Open browser naar `http://192.168.4.1`
5. Vul in:
   - WiFi SSID en password
   - API URL
   - API Key
   - Device Serial Number
6. Klik "Save"
7. ESP32 herstart en verbindt automatisch

### Factory Reset

1. Houd BOOT knop (GPIO 0) 3 seconden ingedrukt tijdens opstarten
2. LED knippert tijdens indrukken
3. Na 3 seconden: alle instellingen worden gewist
4. ESP32 herstart in first-boot staat
5. Config portal start automatisch

### Reconfiguratie

Als WiFi connect herhaaldelijk faalt:
- Config portal start automatisch na timeout
- Of: gebruik factory reset om opnieuw te beginnen

## Code Structuur

```
firmware/src/
├── provisioning.h/cpp    # ProvisioningManager class
├── reset_button.h/cpp    # ResetButtonHandler class
├── main.cpp              # Main boot flow
├── wifi_manager.h/cpp     # WiFiManager wrapper
└── config.h/cpp          # ConfigManager (backward compatibility)
```

## Testen

1. **First-boot test**: 
   - Wis NVS: `preferences.clear()` in code of gebruik factory reset
   - Upload firmware
   - Verifieer dat config portal start

2. **Provisioning test**:
   - Configureer via portal
   - Verifieer dat instellingen worden opgeslagen
   - Herstart ESP32
   - Verifieer automatische WiFi connect

3. **Reset test**:
   - Houd BOOT knop 3 seconden ingedrukt
   - Verifieer dat alle instellingen worden gewist
   - Verifieer dat config portal start na herstart

4. **Edge case test**:
   - Verwijder WiFi router
   - Verifieer dat portal start na timeout
   - Verifieer reconfiguratie mogelijk is

## Troubleshooting

### Config portal start niet
- Controleer Serial Monitor output
- Verifieer dat `provisioning.begin()` succesvol is
- Check NVS namespace kan worden geopend

### Instellingen worden niet onthouden
- Controleer NVS opslag in logs
- Verifieer `provisioning.save()` wordt aangeroepen
- Check flash geheugen is niet vol

### Reset knop werkt niet
- Verifieer GPIO 0 is correct geconfigureerd
- Check INPUT_PULLUP mode
- Test met Serial Monitor output

### WiFi connect faalt
- Controleer SSID en password zijn correct
- Verifieer router is bereikbaar
- Check timeout waarde (standaard 20s)

## Notities

- WiFi password wordt ook opgeslagen door WiFiManager in eigen NVS namespace
- ProvisioningManager gebruikt individuele keys voor betere controle
- ConfigManager blijft bestaan voor backward compatibility
- Flash write cycles zijn beperkt - schrijf enkel bij wijzigingen
