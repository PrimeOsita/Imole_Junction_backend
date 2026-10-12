const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { env, assertRequiredEnv } = require('./config/env');
const redisClient = require('./Mongoose connection/redis');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./docs/swagger');

const { connectDatabase } = require('./config/database');
require('./Mongoose connection/redis'); 
const { logger } = require('./utils/logger');
const { v1Router } = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

assertRequiredEnv();

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'IMOLE API Docs' }));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/v1', v1Router);

app.use(notFoundHandler);
app.use(errorHandler); 

async function start() {
    try {
      await connectDatabase();
        await redisClient.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.log('Failed to connect to Redis:', err.message);
    }

}
  app.listen(env.port, () => {
    logger.info(`IMOLE backend listening on port ${env.port}`);
  });

start();