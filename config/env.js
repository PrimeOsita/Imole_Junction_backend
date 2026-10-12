require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/imole',

  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,

  childTokenSecret: process.env.CHILD_TOKEN_SECRET,
  parentJwtSecret: process.env.PARENT_JWT_SECRET,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  adminSeedEmail: process.env.ADMIN_SEED_EMAIL,
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD,

  submitRateLimitMax: Number(process.env.SUBMIT_RATE_LIMIT_MAX) || 20,
  submitRateLimitWindowMs: Number(process.env.SUBMIT_RATE_LIMIT_WINDOW_MS) || 60000,
};

// Fail fast if a secret is missing outside local dev — better to crash on
// boot than to silently sign tokens with `undefined`.
function assertRequiredEnv() {
  const required = ['childTokenSecret', 'parentJwtSecret', 'adminJwtSecret'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length && env.nodeEnv !== 'test') {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

module.exports = { env, assertRequiredEnv };