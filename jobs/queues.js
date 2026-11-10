// const { Queue } = require('bullmq');
// const {redisClient}  = require('../Mongoose connection/redis');

// const connection = redisClient;

// const assignmentQueue = new Queue('assign-daily-challenge', { connection });
// const streakQueue = new Queue('recalculate-streaks', { connection });
// const leaderboardQueue = new Queue('recompute-leaderboard', { connection });
// const certificateQueue = new Queue('generate-certificate', { connection });
// const analyticsQueue = new Queue('export-analytics', { connection });

// module.exports = {
//   connection,
//   assignmentQueue,
//   streakQueue,
//   leaderboardQueue,
//   certificateQueue,
//   analyticsQueue,
// };


// const { Queue } = require('bullmq');
// const { env } = require('../config/env');

// const connection = {
//   host: env.redisHost,
//   port: env.redisPort,
//   username: env.redisUsername,
//   password: env.redisPassword,
//   maxRetriesPerRequest: null,

//   ...(env.redisTls && {
//     tls: {},
//   }),
// };

// const assignmentQueue = new Queue('assign-daily-challenge', {
//   connection,
// });

// const streakQueue = new Queue('recalculate-streaks', {
//   connection,
// });

// const leaderboardQueue = new Queue('recompute-leaderboard', {
//   connection,
// });

// const certificateQueue = new Queue('generate-certificate', {
//   connection,
// });

// const analyticsQueue = new Queue('export-analytics', {
//   connection,
// });

// module.exports = {
//   connection,
//   assignmentQueue,
//   streakQueue,
//   leaderboardQueue,
//   certificateQueue,
//   analyticsQueue,
// };


const { Queue } = require('bullmq');
const { env } = require('../config/env');

const connection = {
    host: env.redisHost,
    port: env.redisPort,
    username: env.redisUsername,
    password: env.redisPassword,
    maxRetriesPerRequest: null,

    ...(env.redisTls && {
        tls: {},
    }),
};

const assignmentQueue = new Queue('assign-daily-challenge', {
    connection,
});

const streakQueue = new Queue('recalculate-streaks', {
    connection,
});

const leaderboardQueue = new Queue('recompute-leaderboard', {
    connection,
});

const certificateQueue = new Queue('generate-certificate', {
    connection,
});

const analyticsQueue = new Queue('export-analytics', {
    connection,
});

// Close all queue connections during application shutdown
async function closeQueues() {
    const queues = [
        assignmentQueue,
        streakQueue,
        leaderboardQueue,
        certificateQueue,
        analyticsQueue,
    ];

    await Promise.allSettled(
        queues.map((queue) => queue.close())
    );
}

module.exports = {
    connection,
    assignmentQueue,
    streakQueue,
    leaderboardQueue,
    certificateQueue,
    analyticsQueue,
    closeQueues,
};