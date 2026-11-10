// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const pinoHttp = require('pino-http');
// const { env, assertRequiredEnv } = require('./config/env');
// const {redisClient} = require('./Mongoose connection/redis');
// const swaggerUi = require('swagger-ui-express');
// const { swaggerSpec } = require('./docs/swagger');

// const { connectDatabase } = require('./config/database');
// require('./Mongoose connection/redis'); 
// const { logger } = require('./utils/logger');
// const { v1Router } = require('./routes/v1');
// const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

// assertRequiredEnv();

// const app = express();
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'IMOLE API Docs' }));
// app.get('/', (req, res) => res.redirect('/api-docs'));
// app.get('/api/v1', (req, res) => res.redirect('/api-docs'));
// app.use(helmet());
// app.use(cors());
// app.use(express.json());
// app.use(pinoHttp({ logger }));

// app.use('/api/v1', v1Router);

// app.use(notFoundHandler);
// app.use(errorHandler); 

// async function start() {
//     try {
//       await connectDatabase();
//         await redisClient.connect();
//         console.log('Connected to Redis successfully');
//     } catch (err) {
//         console.log('Failed to connect to Redis:', err.message);
//     }

// }
//   app.listen(env.port, () => {
//     logger.info(`IMOLE backend listening on port ${env.port}`);
//   });

// start();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const { closeQueues } = require('./jobs/queues');
const { env, assertRequiredEnv } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { redisClient } = require('./Mongoose connection/redis');
const { startJobs } = require('./jobs');
const { logger } = require('./utils/logger');
const { swaggerSpec } = require('./docs/swagger');

const { v1Router } = require('./routes/v1');
const {
  notFoundHandler,
  errorHandler,
} = require('./middlewares/errorHandler');

assertRequiredEnv();

// const app = express();

// app.use(helmet());
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// app.use(express.json({ limit: '1mb' }));
// app.use(pinoHttp({ logger }));

// app.use(
//   '/api-docs',
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec, {
//     customSiteTitle: 'IMOLE API Docs',
//   })
// );

// app.get('/', (req, res) => res.redirect('/api-docs'));
// app.get('/api/v1', (req, res) => res.redirect('/api-docs'));

// app.use('/api/v1', v1Router);

// app.use(notFoundHandler);
// app.use(errorHandler);
const app = express();

// 1. CORS
app.use(cors("*"));

// 2. Security
app.use(helmet());

// 3. Request body parser
app.use(express.json({ limit: '1mb' }));

// 4. HTTP logger
app.use(pinoHttp({ logger }));

// 5. Swagger documentation
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'IMOLE API Docs',
    })
);

// 6. Root routes
app.get('/', (req, res) => res.redirect('/api-docs'));
app.get('/api/v1', (req, res) => res.redirect('/api-docs'));

// 7. API routes
app.use('/api/v1', v1Router);

// 8. Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

let server;
let workers = [];

async function start() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connection successful');
    
    // 2. Connect to Redis
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis connection successful');
    const redisInfo = await redisClient.info('clients');

const connectedClients = redisInfo.match(/connected_clients:(\d+)/);
const maxClients = redisInfo.match(/maxclients:(\d+)/);

logger.info({
    connectedClients: connectedClients ? connectedClients[1] : 'Not available',
    maxClients: maxClients ? maxClients[1] : 'Not available'
}, 'Redis connection statistics');
    // 3. Start background workers
    // workers = await startJobs();

    // 4. Start Express only after required services are ready
    server = app.listen(env.port, () => {
      logger.info(`IMOLE backend listening on port ${env.port}`);
    });

  } catch (err) {
    logger.error({ err }, 'Application startup failed');

    await shutdown();
    process.exit(1);
  }
}

async function shutdown() {
    logger.info('Shutting down IMOLE backend');

    // 1. Stop accepting new HTTP requests
    if (server) {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }

    // 2. Close background workers
    await Promise.allSettled(
        workers.map((worker) => worker.close())
    );

    // 3. Close all BullMQ queues
    await closeQueues();

    // 4. Close the main Redis and MongoDB connections
    await Promise.allSettled([
        redisClient.quit(),
        disconnectDatabase(),
    ]);

    logger.info('IMOLE backend shutdown completed');
}

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

if (require.main === module) {
  start();
}

module.exports = { app, start, shutdown };
