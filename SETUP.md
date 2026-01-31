# Setup Guide - IoT Refrigeration Monitoring Platform

This guide will walk you through setting up the platform from scratch.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** (lokaal) of **Supabase** (cloud) - [Supabase](https://supabase.com) / [PostgreSQL](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/)

> **Cloud setup:** Zie [SUPABASE.md](./SUPABASE.md) voor Supabase Postgres + deployment naar de cloud (Railway, Vercel).

## Step-by-Step Setup

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE coldmonitor;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/coldmonitor?schema=public"
# JWT_SECRET="your-super-secret-jwt-key-change-this"
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file:
# VITE_API_URL=http://localhost:3001/api
# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here (optional but recommended)
```

**Google Maps API Key (Optional but Recommended):**

For better address validation and map preview when creating locations:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Maps Embed API
4. Create credentials (API Key)
5. Add the key to your `.env` file as `VITE_GOOGLE_MAPS_API_KEY`

**Note:** The app will work without a Google Maps API key using a fallback method, but address validation will be less reliable.

### 4. Database Migration

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## First Steps

### 1. Register as a Customer

1. Click "Register" on the login page
2. Fill in:
   - Company Name
   - Contact Name
   - Email
   - Password
   - (Optional) Technician ID if you have one
3. Click "Create Account"

### 2. Create a Location

After logging in:
1. Navigate to **Locations** in the sidebar
2. Click **"Add Location"** button
3. Fill in:
   - Location Name (e.g., "Main Store")
   - Address (optional)
4. Click **"Create Location"**

### 3. Create a Cold Cell

1. Navigate to **Cold Cells** in the sidebar
2. Click **"Add Cold Cell"** button
3. Fill in:
   - Cold Cell Name (e.g., "Freezer 1")
   - Select Location from dropdown
   - Type: Fridge or Freezer
   - Min Temperature threshold (°C)
   - Max Temperature threshold (°C)
4. Click **"Create Cold Cell"**

### 4. Register a Device

1. Create a device with a serial number
2. Assign it to a cold cell

### 5. Send Test Data

Use the IoT endpoint to send test readings:

```bash
curl -X POST http://localhost:3001/api/readings/devices/YOUR-SERIAL/readings \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 4.5,
    "humidity": 65.0,
    "powerStatus": true,
    "doorStatus": false
  }'
```

## Creating a Technician Account

Technicians can be created via the API:

```bash
curl -X POST http://localhost:3001/api/auth/register/technician \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Technician",
    "email": "tech@example.com",
    "password": "securepassword",
    "companyName": "Tech Services Inc"
  }'
```

Then link customers to technicians by updating the customer's `linkedTechnicianId`.

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` matches your PostgreSQL setup
- Ensure database `coldmonitor` exists

### Port Already in Use

- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will suggest an alternative port automatically

### CORS Errors

- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Default: `http://localhost:5173`

### Prisma Migration Issues

```bash
# Reset database (WARNING: Deletes all data)
cd backend
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name init
```

## Production Deployment

**Volledige cloud-deployment (Supabase, Railway, Vercel):** zie [SUPABASE.md](./SUPABASE.md).

### Handmatige deployment

**Backend:**
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Build: `npm run build`
4. Start: `npm run start`
5. Use a process manager like PM2

**Frontend:**
1. Build: `npm run build`
2. Serve the `dist/` folder with a web server (nginx, Apache, etc.)
3. Update `VITE_API_URL` to point to your production backend

## Next Steps

- Set up email notifications (SendGrid, AWS SES)
- Configure device API key authentication
- Add SSL certificates for HTTPS
- Set up monitoring and logging
- Configure backup strategy for PostgreSQL

## Support

For issues or questions, check the main README.md or create an issue in the repository.
