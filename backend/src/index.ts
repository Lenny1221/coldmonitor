import express from 'express';
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

// Legacy routes (to be migrated or kept for compatibility)
import customerRoutes from './routes/customers';
import locationRoutes from './routes/locations';
import coldCellRoutes from './routes/coldcells';
import technicianRoutes from './routes/technicians';
import invitationRoutes from './routes/invitations';

dotenv.config();

const app = express();
const PORT = config.port;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS - ondersteunt meerdere origins (lokaal + cloud)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.frontendUrls.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API rate limiting (applied to all API routes except auth)
// Auth routes have their own rate limiter
app.use('/api', (req, res, next) => {
  // Skip rate limiting for auth routes (they have their own limiter)
  if (req.path.startsWith('/auth')) {
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

// Legacy routes (still functional)
app.use('/api/customers', customerRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/coldcells', coldCellRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/invitations', invitationRoutes);

// Error handling (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: config.nodeEnv,
    frontendUrl: config.frontendUrl,
  });
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
