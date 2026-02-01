# Supabase Postgres & Cloud Deployment

Handleiding om de webapplicatie en app te draaien op Supabase Postgres (in plaats van lokaal) en te deployen naar de cloud.

---

## Overzicht

> Zie **[LOCAL_AND_CLOUD.md](./LOCAL_AND_CLOUD.md)** voor een korte handleiding om lokaal te werken én tegelijk de cloud te gebruiken.

| Component | Lokaal | Cloud |
|-----------|--------|-------|
| Database | PostgreSQL lokaal | **Supabase Postgres** |
| Backend | localhost:3001 | Railway / Render / Fly.io |
| Frontend | localhost:5173 | Vercel / Netlify |
| iOS-app | Xcode simulator | Zelfde frontend → wijst naar cloud backend |

---

## Stap 1: Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en log in
2. **New Project** → kies organisatie, vul naam in (bv. `coldmonitor`)
3. Kies regio (bv. Frankfurt voor EU)
4. Stel database-wachtwoord in (bewaar dit goed)
5. Klik **Create new project**

---

## Stap 2: Connection string ophalen

1. In Supabase: **Project Settings** (tandwiel) → **Database**
2. Scroll naar **Connection string**
3. Kies **URI** en kopieer de string
4. Vervang `[YOUR-PASSWORD]` door je database-wachtwoord

**Directe verbinding** (voor migraties en normale Node.js backend):
```
postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
```

**Pooled verbinding** (voor serverless, bv. Vercel):
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

> **Tip:** Gebruik de **directe** verbinding (poort 5432) voor Railway/Render. Gebruik **pooled** (poort 6543) voor serverless platforms zoals Vercel.

---

## Stap 3: Backend configureren voor Supabase

In `backend/.env`:

```env
# Supabase Postgres (direct voor migraties + normale hosting)
DATABASE_URL="postgresql://postgres:[WACHTWOORD]@db.[project-ref].supabase.co:5432/postgres"

JWT_SECRET="een-lange-random-string-min-32-karakters"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production

# Wordt ingevuld na deployment (zie hieronder)
FRONTEND_URL="https://jouw-frontend.vercel.app"
```

### Migraties draaien op Supabase

```bash
cd backend
npm run db:generate
npm run db:migrate
```

De tabellen worden aangemaakt in Supabase. Controleer in Supabase → **Table Editor**.

---

## Stap 4: Backend deployen (Railway of Render)

### Optie A: Railway

1. Ga naar [railway.app](https://railway.app) en log in met GitHub
2. **New Project** → **Deploy from GitHub repo** → kies je repo
3. **Add variables** → voeg alle `backend/.env` variabelen toe:
   - `DATABASE_URL` (Supabase connection string)
   - `JWT_SECRET`
   - `FRONTEND_URL` (frontend-URL, bv. https://xxx.vercel.app)
   - `PORT` = 3001 (of laat Railway de eigen PORT gebruiken)
4. Railway stelt automatisch `NODE_ENV=production` in
5. **Root Directory:** `backend`
6. **Build Command:** `npm install && npx prisma generate && npm run build`
7. **Start Command:** `npx prisma migrate deploy && npm run start`
8. Na deploy: kopieer de public URL (bv. `https://jouw-backend.up.railway.app`)

### Optie B: Render

1. Ga naar [render.com](https://render.com) en log in
2. **New** → **Web Service**
3. Verbind je GitHub repo
4. **Root Directory:** `backend`
5. **Build Command:** `npm install && npx prisma generate && npm run build`
6. **Start Command:** `npx prisma migrate deploy && npm run start`
7. **Environment:** voeg `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` toe
8. Na deploy: kopieer de URL (bv. `https://jouw-backend.onrender.com`)

---

## Stap 5: Frontend deployen (Vercel)

1. Ga naar [vercel.com](https://vercel.com) en log in met GitHub
2. **Add New** → **Project** → importeer je repo
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Environment Variables:**
   - `VITE_API_URL` = `https://jouw-backend.up.railway.app/api` (jouw backend-URL + `/api`)
6. **Deploy**

Noteer de frontend-URL (bv. `https://coldmonitor.vercel.app`).

---

## Stap 6: Backend CORS bijwerken

Update in je backend-omgeving (Railway/Render):

```
FRONTEND_URL=https://jouw-frontend.vercel.app
```

Zonder `https://` werkt CORS niet goed. Gebruik exact de URL van Vercel.

---

## Stap 7: iOS-app configureren

In `frontend/.env` (voor `npm run cap:sync`):

```env
VITE_API_URL=https://jouw-backend.up.railway.app/api
```

Dan opnieuw syncen:

```bash
cd frontend
npm run cap:sync
```

De app praat dan met je cloud-backend in plaats van localhost.

---

## Samenvatting variabelen

### Backend (Railway/Render)

| Variabele      | Waarde                                    |
|----------------|-------------------------------------------|
| `DATABASE_URL` | Supabase connection string                |
| `JWT_SECRET`   | Lange random string (min. 32 tekens)      |
| `FRONTEND_URL` | `https://jouw-frontend.vercel.app`        |
| `PORT`         | 3001 (of platform default)                |

### Frontend (Vercel)

| Variabele      | Waarde                                         |
|----------------|------------------------------------------------|
| `VITE_API_URL` | `https://jouw-backend.up.railway.app/api`      |

---

## Troubleshooting

### Database connection failed
- Controleer of `DATABASE_URL` klopt en je wachtwoord juist is
- Supabase → **Database** → **Connection pooling**: gebruik direct voor Railway/Render

### CORS errors
- Controleer of `FRONTEND_URL` exact overeenkomt (inclusief https, geen trailing slash)
- Meerdere origins: `FRONTEND_URL="https://coldmonitor.vercel.app,http://localhost:5173"` (comma-separated)

### Migraties falen
- Gebruik de **directe** connection string (poort 5432) voor `prisma migrate`
- De pooled string (6543) kan problemen geven bij migraties

### Railway crasht direct na deploy
1. **Build Command moet `npm run build` bevatten** – TypeScript moet gecompileerd worden
2. **Root Directory** moet op `backend` staan (niet de repo-root)
3. **Variables** controleren: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` moeten gezet zijn
4. Logs bekijken: Railway Dashboard → je service → **Deployments** → klik op deployment → **View Logs**
5. Er staat een `railway.toml` in de backend-map; bij Root Directory `backend` wordt die automatisch gebruikt
