// const { logger } = require('../utils/logger');
// const { registerSchedules } = require('./schedulers');
// const { startAssignDailyChallengeWorker } = require('./workers/assignDailyChallenge.worker.js');
// const { startRecalculateStreaksWorker } = require('./workers/recalculateStreaks.worker.js');
// const { startRecomputeLeaderboardWorker } = require('./workers/recomputeLeaderboard.worker.js');
// const { startGenerateCertificateWorker } = require('./workers/generateCertificate.worker.js');
// const { startExportAnalyticsWorker } = require('./workers/exportsAnalytics.worker.js');

// // Starts every worker in this process and registers the repeatable jobs.
// // Called once from server.js after the database is connected.
// async function startJobs() {
//   const workers = [
//     startAssignDailyChallengeWorker(),
//     startRecalculateStreaksWorker(),
//     startRecomputeLeaderboardWorker(),
//     startGenerateCertificateWorker(),
//     startExportAnalyticsWorker(),
//   ];

//   workers.forEach((worker) => {
//     worker.on('failed', (job, err) => {
//       logger.error({ err, queue: worker.name, jobId: job && job.id }, 'Job failed');
//     });
//   });

//   await registerSchedules();
//   logger.info('Background workers started');

//   return workers;
// }

// module.exports = { startJobs };


const { logger } = require('../utils/logger');
const { registerSchedules } = require('./schedulers');

const {
  startAssignDailyChallengeWorker,
} = require('./workers/assignDailyChallenge.worker.js');

const {
  startRecalculateStreaksWorker,
} = require('./workers/recalculateStreaks.worker.js');

const {
  startRecomputeLeaderboardWorker,
} = require('./workers/recomputeLeaderboard.worker.js');

const {
  startGenerateCertificateWorker,
} = require('./workers/generateCertificate.worker.js');

const {
  startExportAnalyticsWorker,
} = require('./workers/exportsAnalytics.worker.js');

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
      logger.error(
        {
          err,
          queue: worker.name,
          jobId: job && job.id,
        },
        'Background job failed'
      );
    });
  });

  workers.forEach((worker) => {
    worker.on('error', (err) => {
      logger.error({ err, worker: worker.name }, 'Worker error');
    });
  });

  await registerSchedules();

  logger.info('All background workers started');

  return workers;
}

module.exports = { startJobs };
