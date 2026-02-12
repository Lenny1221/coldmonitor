# ColdMonitor – Real-time deurstatus architectuur

## Overzicht

Real-time deurstatus ("Open"/"Gesloten") met directe app-updates en gedetailleerde logging.

## End-to-end flow

```
ESP32 (deursensor) → POST /door-events → Backend (DB + SSE) → App (live update)
```

**Latency target:** < 1 seconde bij stabiele WiFi

---

## 1. ESP32 (edge)

### Deursensor
- Digitale input (reed switch / microswitch)
- Debounce: **50 ms** (filtert hardware bounce)
- Polling: elke 25 ms in sensor task

### Event queue
- Ring buffer: max 32 events
- Bij state change: `enqueue()` → FIFO
- Rate limit: max 5 events/seconde per device

### Upload
- Bij WiFi + API: direct single-event POST
- Bij offline: events blijven in queue, flush bij reconnect
- Cooldown: 150 ms tussen HTTP requests

### API
```
POST /api/readings/devices/{serial}/door-events
Headers: x-device-key: <api_key>
Body: { device_id, state, timestamp, seq, rssi?, uptime_ms? }
```

---

## 2. Backend

### Tabellen
- **DoorEvent**: event log (deviceId, state, timestamp, seq)
- **DeviceState**: laatste status + doorOpenedAt (voor total_open_seconds)
- **DoorStatsDaily**: per dag (opens, closes, total_open_seconds)

### Idempotency
- Unique constraint: `(deviceId, seq)`
- Duplicate → 200 OK, geen dubbele records

### total_open_seconds
- Bij OPEN: `doorOpenedAt = eventTime`
- Bij CLOSED: `total_open_seconds += (eventTime - doorOpenedAt)` in DoorStatsDaily

### Realtime
- SSE: `GET /api/coldcells/:id/state/stream`
- Bij event: publish naar subscribers van de cold cell

---

## 3. App

### Realtime
- SSE als default (live updates)
- Indicator: **Live** (groen) of **Vertraagd** (amber)

### Fallback
- Polling: `GET /api/coldcells/:id/state` elke 5 s

### UI
- "Deur: Open" / "Deur: Gesloten"
- "Laatste wijziging: dd/MM HH:mm"
- "Vandaag: X× open / Y× dicht • Z min open"

---

## Tests

### Duplicate event
- Zelfde (deviceId, seq) tweemaal → tweede keer 200 duplicate, geen nieuwe DB-record

### Debounce (firmware)
- Korte puls < 50 ms → geen event

### Offline flush (firmware)
- WiFi uit → events in queue → WiFi aan → flush in volgorde
