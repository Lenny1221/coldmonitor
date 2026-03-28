import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

// Config
import { config } from './config/env';
import { logger } from './utils/logger';

// Middleware
import { requestLogger } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Routes (new module structure)
import authRoutes from './modules/auth/auth.controller';
import readingsRoutes from './modules/readings/readings.controller';
import alertsRoutes from './modules/alerts/alerts.controller';
import dashboardRoutes from './modules/dashboard/dashboard.controller';
import devicesRoutes from './modules/devices/devices.controller';
import escalationRoutes from './modules/escalation/escalation.controller';
import reportsRoutes from './modules/reports/reports.controller';
import installationsRoutes from './modules/maintenance/installations.controller';
import ticketsRoutes from './modules/maintenance/tickets.controller';
import refrigerantLogbookRoutes from './modules/refrigerantLogbook/refrigerantLogbook.controller';
import firmwareRoutes from './modules/firmware/firmware.controller';
import contactRoutes from './modules/contact/contact.controller';

// Legacy routes (to be migrated or kept for compatibility)
import customerRoutes from './routes/customers';
import locationRoutes from './routes/locations';
import coldCellRoutes from './routes/coldcells';
import technicianRoutes from './routes/technicians';
import invitationRoutes from './routes/invitations';
import { jobs } from './jobs';

dotenv.config();

const app = express();
const PORT = config.port;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS - ondersteunt meerdere origins (lokaal + cloud + Capacitor iOS)
const isCapacitorOrigin = (o: string) => o?.startsWith('capacitor://') || o?.startsWith('ionic://');
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.frontendUrls.includes(origin)) return cb(null, true);
      if (isCapacitorOrigin(origin)) return cb(null, true);
      // Log geweigerde origin (zichtbaar in Railway logs) om FRONTEND_URL te controleren
      logger.warn('CORS geweigerd – zet FRONTEND_URL op Railway op deze exacte waarde', { receivedOrigin: origin, allowed: config.frontendUrls });
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check (root + onder /api voor frontend-check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API rate limiting (applied to all API routes except auth)
// Auth routes have their own rate limiter
app.use('/api', (req, res, next) => {
  // Skip rate limiting for auth routes (they have their own limiter)
  if (req.path.includes('/auth')) {
    return next();
  }
  apiRateLimiter(req, res, next);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/installations', installationsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/refrigerant-logbook', refrigerantLogbookRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api', escalationRoutes);

// Legacy routes (still functional)
app.use('/api/customers', customerRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/coldcells', coldCellRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/invitations', invitationRoutes);

// Serve frontend (wanneer gebouwd met backend - alles via Railway)
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  // CSP-headers: staan GA4 en andere externe bronnen expliciet toe
  const cspMiddleware = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        // 'unsafe-inline' nodig voor Vite-bundel + inline styles; gtag.js mag laden
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
        // GA4 stuurt beacons naar deze domeinen
        "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://region1.google-analytics.com wss:",
        // Afbeeldingen: eigen domein + Unsplash + GA4-pixel
        "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://images.unsplash.com",
        // Fonts via Google Fonts
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; ')
    );
    next();
  };

  app.use(cspMiddleware);
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// 404 handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found', path: req.path });
  }
  next();
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: config.nodeEnv,
    frontendUrl: config.frontendUrl,
  });

  // Power-loss detection: run every 15s (threshold 30s = 3x heartbeat)
  setInterval(() => jobs.checkDeviceOffline(), 15000);
  logger.info('Device offline check job started (every 15s)');

  // Escalatie: run every minute (20 min L1→L2, 15 min L2→L3)
  setInterval(() => jobs.escalateAlerts(), 60 * 1000);
  logger.info('Escalatie-job gestart (elke minuut)');

  // HACCP auto-send: wekelijks maandag om 6:00
  const scheduleHaccpAutoSend = () => {
    const runAtNextMonday6 = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(6, 0, 0, 0);
      const day = now.getDay(); // 0=Sun, 1=Mon, ...
      const daysUntilMonday = day === 1 && now.getHours() >= 6 ? 7 : (8 - day) % 7;
      next.setDate(next.getDate() + daysUntilMonday);
      return next.getTime() - now.getTime();
    };
    const schedule = () => {
      const ms = runAtNextMonday6();
      setTimeout(() => {
        jobs.haccpAutoSend();
        setInterval(() => jobs.haccpAutoSend(), 7 * 24 * 60 * 60 * 1000);
      }, ms);
    };
    schedule();
    logger.info('HACCP auto-send job gepland (wekelijks maandag 6:00)');
  };
  scheduleHaccpAutoSend();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
