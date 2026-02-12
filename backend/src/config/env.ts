import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Comma-separated voor meerdere origins (bv. lokaal + Vercel)
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0]?.trim() || 'http://localhost:5173',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  // Voldoende hoog voor SPA: cold cell refresh elke 20s + dashboard + navigatie (~20+ req/min mogelijk)
  rateLimitMax: parseInt(
    process.env.RATE_LIMIT_MAX || 
    (process.env.NODE_ENV === 'development' ? '1000' : '500'), 
    10
  ), // Requests per window (500 per 15 min ≈ 33/min)
  // Higher limit in development, lower in production
  authRateLimitMax: parseInt(
    process.env.AUTH_RATE_LIMIT_MAX || 
    (process.env.NODE_ENV === 'development' ? '100' : '20'), 
    10
  ), // Failed auth attempts per window (successful logins don't count)

  // Device Offline Detection (power-loss alarm)
  // Threshold = 30s (3x heartbeat interval). Device offline => POWER_LOSS alert.
  deviceOfflineThresholdSeconds: parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '30', 10),
};
