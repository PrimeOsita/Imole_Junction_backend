const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { issueCertificateIfEligible } = require('../../services/certificateService');

function startGenerateCertificateWorker() {
  return new Worker(
    'generate-certificate',
    async (job) => {
      const certificate = await issueCertificateIfEligible(job.data.childId, job.data.skillId);
      return { certificateId: certificate ? String(certificate._id) : null };
    },
    { connection }
  );
}

module.exports = { startGenerateCertificateWorker };