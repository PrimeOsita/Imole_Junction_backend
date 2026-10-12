const { Queue } = require('bullmq');
const { redisClient } = require('../Mongoose connection/redis');

const connection = redisClient;

const assignmentQueue = new Queue('assign-daily-challenge', { connection });
const streakQueue = new Queue('recalculate-streaks', { connection });
const leaderboardQueue = new Queue('recompute-leaderboard', { connection });
const certificateQueue = new Queue('generate-certificate', { connection });
const analyticsQueue = new Queue('export-analytics', { connection });

module.exports = {
  connection,
  assignmentQueue,
  streakQueue,
  leaderboardQueue,
  certificateQueue,
  analyticsQueue,
};