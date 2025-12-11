import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: '🚫 Too many login attempts. Please try again after 15 minutes for security reasons.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Rate limiter for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: '⚠️ Too many requests from this device. Please slow down and try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    error: '🚫 Too many accounts created. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
