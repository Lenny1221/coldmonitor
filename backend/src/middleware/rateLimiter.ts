import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

const isDevelopment = config.nodeEnv === 'development';

// General API rate limiter
// In development, use a much higher limit or disable entirely
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting entirely in development if limit is very high
  // Skip for device requests (ESP32): they use x-device-key and can burst when uploading backlog
  skip: (req) =>
    (isDevelopment && config.rateLimitMax >= 1000) ||
    !!req.headers['x-device-key'],
});

// Stricter rate limiter for authentication routes
// Only counts failed attempts (successful logins don't count)
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});
