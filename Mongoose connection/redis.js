// const { createClient } = require('redis')


// const redisClient = createClient({
//     username: process.env.REDIS_USERNAME,
//     password: process.env.REDIS_PASSWORD, 
//     socket: {
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT
//     }
// })

// redisClient.on('error', (err) => console.log('Redis Client Error', err))    
//  module.exports = redisClient


const Redis = require('ioredis');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

const redisClient = new Redis({
  host: env.redisHost,
  port: env.redisPort,
  username: env.redisUsername,
  password: env.redisPassword,
  maxRetriesPerRequest: 3,
  lazyConnect: true,

  ...(env.redisTls && {
    tls: {},
  }),
});

redisClient.on('connect', () => {
  logger.info('Redis connection established');
});

redisClient.on('ready', () => {
  logger.info('Redis is ready');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redisClient.on('close', () => {
  logger.warn('Redis connection closed');
});

module.exports = { redisClient };