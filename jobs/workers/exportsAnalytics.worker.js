const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { buildAnalyticsCsv } = require('../../services/analyticsService');

function startExportAnalyticsWorker() {
  return new Worker('export-analytics', async () => buildAnalyticsCsv(), { connection });
}

module.exports = { startExportAnalyticsWorker };