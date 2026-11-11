// require('dotenv').config();

// const env = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: Number(process.env.PORT) || 4000,

//   mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/imole',

//   redisHost: process.env.REDIS_HOST || '127.0.0.1',
//   redisPort: Number(process.env.REDIS_PORT) || 6379,
//   redisPassword: process.env.REDIS_PASSWORD || undefined,

//   childTokenSecret: process.env.CHILD_TOKEN_SECRET,
//   parentJwtSecret: process.env.PARENT_JWT_SECRET,
//   adminJwtSecret: process.env.ADMIN_JWT_SECRET,
//   jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

//   adminSeedEmail: process.env.ADMIN_SEED_EMAIL,
//   adminSeedPassword: process.env.ADMIN_SEED_PASSWORD,

//   submitRateLimitMax: Number(process.env.SUBMIT_RATE_LIMIT_MAX) || 20,
//   submitRateLimitWindowMs: Number(process.env.SUBMIT_RATE_LIMIT_WINDOW_MS) || 60000,
// };

// // Fail fast if a secret is missing outside local dev — better to crash on
// // boot than to silently sign tokens with `undefined`.
// function assertRequiredEnv() {
//   const required = ['childTokenSecret', 'parentJwtSecret', 'adminJwtSecret'];
//   const missing = required.filter((key) => !env[key]);

//   if (missing.length && env.nodeEnv !== 'test') {
//     throw new Error(`Missing required env vars: ${missing.join(', ')}`);
//   }
// }

// module.exports = { env, assertRequiredEnv };


require('dotenv').config();

const legacyPremiumInterval = process.env.FLW_PREMIUM_INTERVAL || 'monthly';

const env = {
  nodeEnv: process.env.NODE_ENV || 'production',
  port: Number(process.env.PORT) || 4000,

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/imole',

  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisUsername: process.env.REDIS_USERNAME || undefined,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisTls: process.env.REDIS_TLS === 'true',

  childTokenSecret: process.env.CHILD_TOKEN_SECRET,
  parentJwtSecret: process.env.PARENT_JWT_SECRET,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  adminSeedEmail: process.env.ADMIN_SEED_EMAIL,
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD,

  submitRateLimitMax: Number(process.env.SUBMIT_RATE_LIMIT_MAX) || 20,
  submitRateLimitWindowMs:
    Number(process.env.SUBMIT_RATE_LIMIT_WINDOW_MS) || 60000,
  flutterwaveSecretKey: process.env.FLW_SECRET_KEY,
  flutterwaveWebhookSecretHash: process.env.FLW_WEBHOOK_SECRET_HASH,
  flutterwavePremiumPlanId: process.env.FLW_PREMIUM_PLAN_ID
    ? Number(process.env.FLW_PREMIUM_PLAN_ID)
    : undefined,
  flutterwavePremiumAmount: process.env.FLW_PREMIUM_AMOUNT
    ? Number(process.env.FLW_PREMIUM_AMOUNT)
    : undefined,
  flutterwavePremiumInterval: process.env.FLW_PREMIUM_INTERVAL || 'monthly',
  flutterwavePremiumMonthlyPlanId: process.env.FLW_PREMIUM_MONTHLY_PLAN_ID
    ? Number(process.env.FLW_PREMIUM_MONTHLY_PLAN_ID)
    : legacyPremiumInterval === 'monthly' && process.env.FLW_PREMIUM_PLAN_ID
      ? Number(process.env.FLW_PREMIUM_PLAN_ID)
      : undefined,
  flutterwavePremiumMonthlyAmount: process.env.FLW_PREMIUM_MONTHLY_AMOUNT
    ? Number(process.env.FLW_PREMIUM_MONTHLY_AMOUNT)
    : legacyPremiumInterval === 'monthly' && process.env.FLW_PREMIUM_AMOUNT
      ? Number(process.env.FLW_PREMIUM_AMOUNT)
      : undefined,
  flutterwavePremiumYearlyPlanId: process.env.FLW_PREMIUM_YEARLY_PLAN_ID
    ? Number(process.env.FLW_PREMIUM_YEARLY_PLAN_ID)
    : legacyPremiumInterval === 'yearly' && process.env.FLW_PREMIUM_PLAN_ID
      ? Number(process.env.FLW_PREMIUM_PLAN_ID)
      : undefined,
  flutterwavePremiumYearlyAmount: process.env.FLW_PREMIUM_YEARLY_AMOUNT
    ? Number(process.env.FLW_PREMIUM_YEARLY_AMOUNT)
    : legacyPremiumInterval === 'yearly' && process.env.FLW_PREMIUM_AMOUNT
      ? Number(process.env.FLW_PREMIUM_AMOUNT)
      : undefined,
  flutterwaveRedirectUrl: process.env.FLW_REDIRECT_URL,
};

function assertRequiredEnv() {
  const required = [
    'childTokenSecret',
    'parentJwtSecret',
    'adminJwtSecret',
    'mongoUri',
    'redisHost',
  ];

  const missing = required.filter((key) => !env[key]);

  if (missing.length && env.nodeEnv !== 'test') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

module.exports = { env, assertRequiredEnv };
