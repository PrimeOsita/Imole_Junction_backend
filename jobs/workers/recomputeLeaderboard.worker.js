const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { recomputeLeaderboard } = require('../../services/leaderboardService');

function startRecomputeLeaderboardWorker() {
  return new Worker('recompute-leaderboard', async () => recomputeLeaderboard(), { connection });
}

module.exports = { startRecomputeLeaderboardWorker };