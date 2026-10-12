const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const submitRateLimiter = rateLimit({
  windowMs: env.submitRateLimitWindowMs,
  max: env.submitRateLimitMax,
  keyGenerator: (req) => String(req.childId || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions — slow down a little.' },
});
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

module.exports = { submitRateLimiter, authRateLimiter };

