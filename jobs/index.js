const { logger } = require('../utils/logger');
const { registerSchedules } = require('./schedulers');
const { startAssignDailyChallengeWorker } = require('./workers/assignDailyChallenge.worker');
const { startRecalculateStreaksWorker } = require('./workers/recalculateStreaks.worker');
const { startRecomputeLeaderboardWorker } = require('./workers/recomputeLeaderboard.worker');
const { startGenerateCertificateWorker } = require('./workers/generateCertificate.worker');
const { startExportAnalyticsWorker } = require('./workers/exportAnalytics.worker');

// Starts every worker in this process and registers the repeatable jobs.
// Called once from server.js after the database is connected.
async function startJobs() {
  const workers = [
    startAssignDailyChallengeWorker(),
    startRecalculateStreaksWorker(),
    startRecomputeLeaderboardWorker(),
    startGenerateCertificateWorker(),
    startExportAnalyticsWorker(),
  ];

  workers.forEach((worker) => {
    worker.on('failed', (job, err) => {
      logger.error({ err, queue: worker.name, jobId: job && job.id }, 'Job failed');
    });
  });

  await registerSchedules();
  logger.info('Background workers started');

  return workers;
}

module.exports = { startJobs };