# Cloud setup – Login/registratie Vercel + Railway

Stap-voor-stap om inloggen en registreren via de cloud (Vercel + Railway) te laten werken.

---

## 1. Railway backend-URL ophalen

1. Ga naar [railway.app](https://railway.app) en open je project.
2. Klik op je **backend service**.
3. Open het tabblad **Settings**.
4. Scroll naar **Networking** → **Public Networking**.
5. Klik op **Generate Domain** als je nog geen domein hebt.
6. Kopieer de URL (bv. `https://coldmonitor-production.up.railway.app`).

---

## 2. Vercel – VITE_API_URL instellen

1. Ga naar [vercel.com](https://vercel.com) en open je project.
2. **Settings** → **Environment Variables**.
3. Voeg toe:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://JOUW-RAILWAY-URL/api`  
     (dus de volledige Railway URL + `/api`)
4. Zorg dat **Production**, **Preview** en **Development** zijn aangevinkt.
5. Klik **Save**.
6. **Deployments** → open het menu (…) van de laatste deployment → **Redeploy**.

> **Belangrijk:** Zonder `VITE_API_URL` probeert de app naar `localhost` te verbinden, wat in de cloud faalt.

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
3. Zorg dat **FRONTEND_URL** precies je Vercel URL is, bv.:
   - `https://coldmonitor.vercel.app`
   - Geen slash aan het eind.
4. Voor meerdere origins (bv. lokaal én cloud):
   ```
   https://coldmonitor.vercel.app,http://localhost:5173
   ```

---

## 5. Overige Railway-variabelen

Controleer ook:
- **JWT_SECRET** – lange willekeurige string (min. 32 tekens)
- **PORT** – wordt meestal automatisch door Railway gezet

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
2. **`FRONTEND_URL`** = exact je Vercel-URL, bv. `https://coldmonitor.vercel.app`
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
   - **Value:** **exact** de URL van je Vercel-site, zoals in de adresbalk:
     - `https://coldmonitor.vercel.app`  
     of  
     - `https://jouw-project.vercel.app`
3. **Regels:**
   - Alleen **https** (niet http) voor Vercel.
   - **Geen slash** aan het eind (dus niet `https://coldmonitor.vercel.app/`).
   - Geen pad erachter (dus niet `https://coldmonitor.vercel.app/login`).
4. **Opslaan** – Railway herstart de service automatisch.

### Meerdere origins (lokaal + Vercel)

Als je ook lokaal tegen Railway wilt testen:

```
https://coldmonitor.vercel.app,http://localhost:5173
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
