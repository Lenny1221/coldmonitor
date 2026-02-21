import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || process.env.BACKEND_URL || `http://localhost:3001`,
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
  // SPA: cold cell 5s + readings/alerts 20s + SSE + nav → ~25 req/min. 1500 = ~100/min marge
  rateLimitMax: parseInt(
    process.env.RATE_LIMIT_MAX || 
    (process.env.NODE_ENV === 'development' ? '2000' : '1500'), 
    10
  ), // Requests per window (1500 per 15 min ≈ 100/min)
  // Higher limit in development, lower in production
  authRateLimitMax: parseInt(
    process.env.AUTH_RATE_LIMIT_MAX || 
    (process.env.NODE_ENV === 'development' ? '100' : '20'), 
    10
  ), // Failed auth attempts per window (successful logins don't count)

  // Device Offline Detection (power-loss alarm)
  // Threshold = 30s (3x heartbeat interval). Device offline => POWER_LOSS alert.
  deviceOfflineThresholdSeconds: parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '30', 10),

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Email (voor verificatie)
  // Resend HTTP API (aanbevolen – geen SMTP/poort nodig)
  // Gebruikt SMTP_PASS als Resend API key wanneer SMTP_HOST=smtp.resend.com
  resendApiKey: process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST === 'smtp.resend.com' ? process.env.SMTP_PASS || '' : '') ||
    '',
  // SMTP (fallback als Resend API niet geconfigureerd)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@intellifrost.local',
};
