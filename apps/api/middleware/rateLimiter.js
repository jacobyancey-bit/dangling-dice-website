import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Limits each IP to 300 requests per 15-minute window.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Strict Authentication Rate Limiter
 * Limits each IP to 15 login/registration attempts per 15-minute window.
 * Protects against automated brute-force password guessing and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Access temporarily throttled to protect your account. Please try again after 15 minutes.',
  },
});
