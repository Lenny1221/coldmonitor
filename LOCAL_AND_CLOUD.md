# Lokaal werken én cloud deployment

Je kunt tegelijk lokaal aanpassingen doen én alles in de cloud laten draaien. **Beide gebruiken dezelfde Supabase-database**, dus wijzigingen zijn direct overal zichtbaar.

---

## Overzicht

| | Lokaal | Cloud |
|---|--------|-------|
| **Frontend** | `localhost:5173` | Vercel (bv. www.intellifrost.be) |
| **Backend** | `localhost:3001` | Railway |
| **Database** | Supabase (zelfde als cloud) | Supabase |
| **Gebruik** | Ontwikkelen, testen | Live voor eindgebruikers |

---

## Lokaal ontwikkelen

### 1. Frontend `.env`

In `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Backend `.env`

In `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
JWT_SECRET="..."
FRONTEND_URL="http://localhost:5173"
PORT=3001
NODE_ENV=development
```

### 3. Starten

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**. Je werkt dan tegen de lokale backend, die verbonden is met Supabase. Wijzigingen in de database zijn ook zichtbaar in de cloud-versie.

---

## Cloud (Vercel + Railway)

### Vercel (frontend)

- **Environment Variables** (Settings → Environment Variables):
  - `VITE_API_URL` = `https://www.intellifrost.be/api`

### Railway (backend)

- **Variables**:
  - `DATABASE_URL` = Supabase connection string
  - `JWT_SECRET` = sterke random string
  - `FRONTEND_URL` = `https://www.intellifrost.be` (of jouw Vercel/custom domain URL)
  - Optioneel voor meerdere origins:  
    `FRONTEND_URL="https://www.intellifrost.be,http://localhost:5173"`

---

## Snel wisselen

- **Lokaal ontwikkelen** → `frontend/.env`: `VITE_API_URL=http://localhost:3001/api`
- **iOS-app (zelfde WiFi)** → `VITE_API_URL=http://192.168.1.208:3001/api` (Mac-IP)
- **Cloud testen** → `VITE_API_URL=https://www.intellifrost.be/api`

Na wijziging van `.env` de frontend herstarten (`npm run dev`).

---

## Push naar cloud

```bash
git add .
git commit -m "Beschrijving wijzigingen"
git push
```

Vercel en Railway deployen automatisch. Dezelfde code draait dan in de cloud.

---

## Cloud: login/registratie werkt niet

Zie **[CLOUD_SETUP.md](./CLOUD_SETUP.md)** voor een volledige handleiding.

**Snel:**
1. **Vercel** → `VITE_API_URL` = `https://www.intellifrost.be/api`
2. **Railway** → `FRONTEND_URL` = `https://www.intellifrost.be`
3. **Redeploy** op Vercel na wijziging van env vars
