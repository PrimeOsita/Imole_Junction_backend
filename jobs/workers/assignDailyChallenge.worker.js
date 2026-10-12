const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { assignDailyChallenge } = require('../../services/challengeService');

function startAssignDailyChallengeWorker() {
  return new Worker(
    'assign-daily-challenge',
    async (job) => {
      const assignment = await assignDailyChallenge(job.data.childId);
      return { assignmentId: String(assignment._id) };
    },
    { connection }
  );
}

module.exports = { startAssignDailyChallengeWorker };