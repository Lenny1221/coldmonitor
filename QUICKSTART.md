# Quick Start Guide

This guide will help you get the Refrigeration Monitoring Platform up and running quickly.

## Step 1: Prerequisites

Make sure you have installed:
- **Node.js** 18+ ([download](https://nodejs.org/))
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/))
- **npm** (comes with Node.js)

## Step 2: Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE refrigeration_monitoring;
   ```

2. Note your database credentials:
   - Host: `localhost` (or your PostgreSQL host)
   - Port: `5432` (default)
   - Database: `refrigeration_monitoring`
   - Username: Your PostgreSQL username
   - Password: Your PostgreSQL password

## Step 3: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/refrigeration_monitoring?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

5. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

6. Run database migrations:
   ```bash
   npm run db:migrate
   ```

7. Create an admin user:
   ```bash
   npm run setup:admin
   ```
   Follow the prompts to create your first admin account.

8. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend should now be running on `http://localhost:3001`

## Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create environment file if you need to customize API URL:
   ```bash
   cp .env.example .env
   ```
   Default is `http://localhost:3001/api` which should work for local development.

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend should now be running on `http://localhost:5173`

## Step 5: Access the Application

1. Open your browser and navigate to: `http://localhost:5173`

2. Login with the admin credentials you created in Step 3.

3. You're all set! Start exploring the platform.

## Testing with Simulated Device

To test the system without physical hardware, you can use the device simulator:

1. First, create a device through the web interface (as Admin).

2. Note the device ID (e.g., `DEVICE-001`).

3. In a new terminal, run the simulator:
   ```bash
   cd backend
   npm run simulate:device DEVICE-001 300000
   ```
   This will send temperature data every 5 minutes (300000 milliseconds).

   You can customize the interval by changing the last parameter (in milliseconds).

4. Watch the dashboard update with the simulated temperature data!

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready` or check the PostgreSQL service
- Double-check your `DATABASE_URL` in `.env`
- Ensure the database exists: `psql -l | grep refrigeration_monitoring`

### Port Already in Use
- Backend port 3001 in use: Change `PORT` in `.env` or stop the conflicting service
- Frontend port 5173 in use: Vite will automatically try the next available port

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running

### Cannot Find Module Errors
- Run `npm install` again in both backend and frontend directories
- Delete `node_modules` and `package-lock.json`, then `npm install` again

## Next Steps

- **Create Clients**: As Admin, you can create client accounts
- **Register Devices**: Add temperature monitoring devices
- **Assign Technicians**: Assign technicians to clients
- **Configure Thresholds**: Set temperature alarm thresholds for each device
- **View Dashboard**: Monitor real-time temperature data
- **Generate Reports**: Export temperature data for compliance

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Build the frontend: `cd frontend && npm run build`
3. Build the backend: `cd backend && npm run build`
4. Use a process manager like PM2: `pm2 start dist/index.js`
5. Serve the frontend build files using a web server like Nginx
6. Use a secure JWT secret (generate with: `openssl rand -base64 32`)
7. Set up SSL/TLS certificates for HTTPS
8. Configure proper database backups

## Getting Help

- Check the main [README.md](README.md) for detailed documentation
- Review API endpoints in the README
- Check the Prisma schema for database structure: `backend/prisma/schema.prisma`
