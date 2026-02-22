# Cloud setup – Login/registratie Vercel + Railway

Stap-voor-stap om inloggen en registreren via de cloud (Vercel + Railway) te laten werken.

---

## 1. Railway backend-URL ophalen

1. Ga naar [railway.app](https://railway.app) en open je project.
2. Klik op je **backend service**.
3. Open het tabblad **Settings**.
4. Scroll naar **Networking** → **Public Networking**.
5. Klik op **Generate Domain** als je nog geen domein hebt.
6. Kopieer de URL (bv. `https://web-production-e67f4.up.railway.app`).

---

## 2. Vercel – VITE_API_URL instellen

1. Ga naar [vercel.com](https://vercel.com) en open je project.
2. **Settings** → **Environment Variables**.
3. Voeg toe:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://www.intellifrost.be/api`  
     (de `vercel.json` proxied `/api` naar Railway)
4. Zorg dat **Production**, **Preview** en **Development** zijn aangevinkt.
5. Klik **Save**.
6. **Deployments** → open het menu (…) van de laatste deployment → **Redeploy**.

> **Belangrijk:** Zonder `VITE_API_URL` probeert de app naar `localhost` te verbinden, wat in de cloud faalt.  
> **Let op:** De `vercel.json` in de frontend bevat een rewrite die `/api/*` proxied naar Railway. Zorg dat de Railway-URL in `vercel.json` overeenkomt met je backend.

---

## 3. Railway – DATABASE_URL (Supabase) instellen

1. Ga naar [supabase.com](https://supabase.com) → jouw project → **Project Settings** (tandwiel) → **Database**.
2. Kopieer de **Connection string** (URI).
3. Vervang `[YOUR-PASSWORD]` door je databasewachtwoord.
4. Formaat: `postgresql://postgres:[WACHTWOORD]@db.[project-ref].supabase.co:5432/postgres`
5. Ga naar [railway.app](https://railway.app) → je backend service → **Variables**.
6. Voeg toe of controleer:
   - **Name:** `DATABASE_URL`
   - **Value:** je Supabase connection string

> Gebruik de **directe** verbinding (poort 5432) voor Railway. De pooled verbinding (6543) is voor serverless.

---

## 4. Railway – FRONTEND_URL instellen

1. Ga naar [railway.app](https://railway.app) en open je backend service.
2. **Variables** (of **Settings** → **Variables**).
3. Zorg dat **FRONTEND_URL** precies je frontend-URL is, bv.:
   - `https://www.intellifrost.be`
   - Geen slash aan het eind.
4. Voor meerdere origins (bv. lokaal én cloud):
   ```
   https://www.intellifrost.be,http://localhost:5173
   ```

---

## 5. Overige Railway-variabelen

Controleer ook:
- **JWT_SECRET** – lange willekeurige string (min. 32 tekens)
- **PORT** – wordt meestal automatisch door Railway gezet

---

## 5b. E-mailverificatie (Resend)

Voor verificatie-e-mails bij registratie:

1. Maak een account op [resend.com](https://resend.com) en kopieer je **API key** (begint met `re_`).
2. Voeg op **Railway** → Variables toe:
   - **`RESEND_API_KEY`** = je Resend API key  
   - **`EMAIL_FROM`** = `onboarding@resend.dev` (Resend default, geen domein nodig)
3. Geen SMTP-configuratie nodig – de backend gebruikt de Resend HTTP API.

**Alternatief:** Als je al SMTP-variabelen voor Resend hebt (`SMTP_HOST=smtp.resend.com`, `SMTP_PASS=re_xxx`), wordt de API key automatisch herkend en gebruikt.

---

## 6. Controleren

### Backend bereikbaar

In de browser: `https://JOUW-RAILWAY-URL/health`  
Je zou iets als `{"status":"ok",...}` moeten zien.

### Vercel-config

Na een **Redeploy** moet de frontend de juiste `VITE_API_URL` gebruiken.  
Zonder nieuwe deploy worden oude env vars nog gebruikt.

---

## Network Error bij inloggen/registreren – checklist

Als je **Network Error** krijgt op Vercel bij inloggen of account aanmaken:

### Stap A: Backend bereikbaar?

1. Open een **nieuw tabblad** en ga naar: `https://JOUW-RAILWAY-URL/health`  
   (vervang door je echte Railway URL)
2. Zie je `{"status":"ok",...}`? → Backend draait. Ga naar Stap B.
3. Zie je een fout of timeout? → Backend staat uit of URL klopt niet. Controleer Railway: service draait, **Variables** (o.a. `DATABASE_URL`, `JWT_SECRET`) zijn ingevuld, en je hebt een **public domain** onder Settings → Networking.

### Stap B: VITE_API_URL op Vercel

1. **Vercel** → je project → **Settings** → **Environment Variables**
2. Staat er **`VITE_API_URL`**?
   - **Nee** → Toevoegen: waarde = `https://JOUW-RAILWAY-URL/api` (zelfde URL als in Stap A, + `/api`)
   - **Ja** → Controleren of de waarde **exact** is: `https://...` (met `https://`), eindigt op `/api`, geen spatie of typfout
3. **Opslaan**, daarna **Deployments** → (…) bij laatste deployment → **Redeploy**.  
   Zonder redeploy gebruikt Vercel de oude (vaak lege) waarde.

### Stap C: CORS (FRONTEND_URL op Railway)

1. **Railway** → je backend service → **Variables**
2. **`FRONTEND_URL`** = exact je frontend-URL, bv. `https://www.intellifrost.be`
   - Geen slash aan het eind
   - Precies hetzelfde als in de adresbalk als je je app opent

Als alles klopt, zou de Network Error weg moeten zijn. Blijft die bestaan, controleer de **browserconsole** (F12 → Console) op een rode CORS- of netwerkfout.

---

## CORS error (xhr) – oplossing

Bij een **CORS error** of **Network Error, type: xhr** blokkeert de backend je frontend omdat de **origin** niet in `FRONTEND_URL` staat.

### Wat je moet doen

1. Ga naar **Railway** → je backend service → **Variables**.
2. Voeg toe of pas aan:
   - **Name:** `FRONTEND_URL`
   - **Value:** **exact** de URL van je frontend-site, zoals in de adresbalk:
     - `https://www.intellifrost.be`  
     of  
     - `https://jouw-project.vercel.app`
3. **Regels:**
   - Alleen **https** (niet http) voor productie.
   - **Geen slash** aan het eind (dus niet `https://www.intellifrost.be/`).
   - Geen pad erachter (dus niet `https://coldmonitor.vercel.app/login`).
4. **Opslaan** – Railway herstart de service automatisch.

### Meerdere origins (lokaal + Vercel)

Als je ook lokaal tegen Railway wilt testen:

```
https://www.intellifrost.be,http://localhost:5173
```

Geen spaties rond de komma.

### Controleren wat de browser stuurt

In **Railway** → je service → **Deployments** → **View Logs**: na een mislukte inlogpoging kun je een regel zien als:

`CORS geweigerd – zet FRONTEND_URL op Railway op deze exacte waarde` met `receivedOrigin: "https://..."`.

Kopieer die `receivedOrigin` en zet die **exact** als `FRONTEND_URL` op Railway.

---

## Data komt niet in SensorReading (Supabase)

Als de ESP32 wel data stuurt maar er **geen rijen** in de tabel **SensorReading** in Supabase verschijnen:

### 1. DATABASE_URL op Railway = Supabase

De backend moet tegen **Supabase** praten, niet tegen een andere database.

1. **Supabase** → jouw project → **Project Settings** (tandwiel) → **Database**.
2. Kopieer de **Connection string** (URI). Vervang `[YOUR-PASSWORD]` door je databasewachtwoord.
3. **Railway** → je backend service → **Variables**.
4. Controleer **`DATABASE_URL`**: de waarde moet **exact** die Supabase connection string zijn, bv.  
   `postgresql://postgres:JOUWWACHTWOORD@db.xxxxx.supabase.co:5432/postgres`
5. Als je eerder een andere database (bv. Railway Postgres) had ingesteld, vervang die door de Supabase-URL en **redeploy** de backend.

### 2. Tabel en migraties

- In **Supabase** → **Table Editor**: controleer of de tabel **SensorReading** bestaat.
- Als die ontbreekt: lokaal in de repo `npx prisma migrate deploy` draaien met `DATABASE_URL` die naar Supabase wijst, of de migraties uit `backend/prisma/migrations` handmatig in Supabase SQL Editor uitvoeren.

### 3. Backend-logs

- **Railway** → je service → **Deployments** → **View Logs**.
- Bij elke ontvangen batch van de logger hoort een regel: **"Sensor reading opgeslagen in DB"** (met readingId). Zie je die niet, dan faalt het schrijven (bv. door verkeerde `DATABASE_URL` of ontbrekende tabel). Zoek ook naar rode foutmeldingen rond `prisma` of `SensorReading`.

### 4. RLS (Row Level Security) inschakelen op SensorReading

Supabase geeft een waarschuwing: **"Table public.SensorReading is public, but RLS has not been enabled."**

**Oplossing:** Voer de RLS-migratie uit:

1. **Lokaal** (met `DATABASE_URL` naar Supabase):
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   Dit voert de nieuwe migratie `20260205101614_enable_rls_sensorreading` uit die RLS inschakelt.

2. **Of handmatig in Supabase:**
   - **Supabase** → **SQL Editor** → voer uit:
   ```sql
   ALTER TABLE "SensorReading" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Enable all operations for authenticated users" ON "SensorReading"
     FOR ALL USING (true) WITH CHECK (true);
   ```

Na deze migratie verdwijnt de Supabase RLS-waarschuwing.

---

## Upload failed: -1 (connection refused / DNS failed)

Als de ESP32 **"Upload failed: -1 connection refused / DNS failed"** logt:

### 1. API URL controleren

- **ESP32 config-portal** (IntelliFrost-Setup) → controleer **API URL**.
- Moet exact zijn: `https://JOUW-RAILWAY-URL/api` (met `https://` en `/api`).
- Geen typfouten, geen extra slashes, geen spatie.

### 2. Backend bereikbaar?

- Open in browser: `https://JOUW-RAILWAY-URL/health`
- Moet `{"status":"ok"}` geven.
- Zie je een fout/timeout? → Backend staat uit of URL klopt niet. Controleer Railway: service draait, **Variables** zijn ingevuld.

### 3. DNS-resolutie

- Als de API URL een **domein** is (bijv. `xxx.railway.app`), controleer of het ESP32-netwerk **DNS** heeft (internet werkt).
- Test: verbind een laptop met hetzelfde WiFi-netwerk en open de API URL in de browser.
- Werkt dat niet? → WiFi-netwerk heeft mogelijk geen internet of blokkeert bepaalde domeinen.

### 4. HTTPS vs HTTP

- Railway-backends gebruiken **HTTPS**. Zorg dat de API URL begint met `https://` (niet `http://`).
- Als je lokaal test met `http://localhost:3001`, gebruik dan `http://` (maar in productie altijd `https://`).

---

## Upload failed: -1 (connection refused / DNS failed)

Als de ESP32 **"Upload failed: -1 connection refused / DNS failed"** logt:

### 1. API URL controleren

- **ESP32 config-portal** (IntelliFrost-Setup) → controleer **API URL**.
- Moet exact zijn: `https://JOUW-RAILWAY-URL/api` (met `https://` en `/api`).
- Geen typfouten, geen extra slashes, geen spatie.

### 2. Backend bereikbaar?

- Open in browser: `https://JOUW-RAILWAY-URL/health`
- Moet `{"status":"ok"}` geven.
- Zie je een fout/timeout? → Backend staat uit of URL klopt niet. Controleer Railway: service draait, **Variables** zijn ingevuld.

### 3. DNS-resolutie

- Als de API URL een **domein** is (bijv. `xxx.railway.app`), controleer of het ESP32-netwerk **DNS** heeft (internet werkt).
- Test: verbind een laptop met hetzelfde WiFi-netwerk en open de API URL in de browser.
- Werkt dat niet? → WiFi-netwerk heeft mogelijk geen internet of blokkeert bepaalde domeinen.

### 4. HTTPS vs HTTP

- Railway-backends gebruiken **HTTPS**. Zorg dat de API URL begint met `https://` (niet `http://`).
- Als je lokaal test met `http://localhost:3001`, gebruik dan `http://` (maar in productie altijd `https://`).

---

## Veelvoorkomende problemen

| Fout | Oorzaak | Oplossing |
|------|---------|-----------|
| **Network Error** | Frontend bereikt backend niet | Zie sectie "Network Error – checklist" hierboven |
| **CORS error (xhr)** | Backend weigert de origin van je frontend | Zie sectie "CORS error – oplossing" hierboven |
| "Kan geen verbinding maken met de server" | `VITE_API_URL` fout of niet gezet | Vercel → `VITE_API_URL` = Railway URL + `/api`, daarna Redeploy |
| CORS-fout in de console | `FRONTEND_URL` klopt niet | Railway → `FRONTEND_URL` = exact je Vercel URL |
| 405 Method Not Allowed | API-requests gaan naar Vercel i.p.v. Railway | `VITE_API_URL` controleren, moet naar Railway wijzen |
| Login werkt lokaal maar niet in de cloud | Configuratie verschil lokaal vs. cloud | Bovenstaande stappen voor Vercel en Railway nalopen |
| Database connection failed | `DATABASE_URL` fout of niet gezet op Railway | Supabase → Connection string kopiëren → Railway Variables |
| **Data niet in SensorReading** | Backend schrijft naar verkeerde DB of tabel ontbreekt | Zie sectie "Data komt niet in SensorReading (Supabase)" hierboven |
| **RLS waarschuwing** | "Table SensorReading is public, but RLS has not been enabled" | Zie sectie "RLS inschakelen" hierboven - voer migratie uit |
| **Upload failed: -1** | Connection refused / DNS failed (ESP32 → backend) | Zie sectie "Upload failed: -1" hieronder |
| **Geen verificatie-e-mail** | SMTP niet bereikbaar of niet geconfigureerd | Gebruik Resend HTTP API: zet `RESEND_API_KEY` en `EMAIL_FROM` op Railway (zie sectie 5b) |