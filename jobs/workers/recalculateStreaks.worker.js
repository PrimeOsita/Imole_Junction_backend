const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { resetMissedStreaks } = require('../../services/streakService');

function startRecalculateStreaksWorker() {
  return new Worker(
    'recalculate-streaks',
    async () => {
      const reset = await resetMissedStreaks();
      return { reset };
    },
    { connection }
  );
}

module.exports = { startRecalculateStreaksWorker };