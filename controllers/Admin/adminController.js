const adminService = require('../../services/adminService');
const analyticsService = require('../../services/analyticsService');
const { analyticsQueue } = require('../../jobs/queues');
const { ApiError } = require('../../middlewares/errorHandler');

exports.login = async (req, res, next) => {
  try {
    const result = await adminService.loginAdmin(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.listChallenges = async (req, res, next) => {
  try {
    const result = await adminService.listChallenges(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getChallenge = async (req, res, next) => {
  try {
    const challenge = await adminService.getChallenge(req.params.id);
    res.json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
};

exports.createChallenge = async (req, res, next) => {
  try {
    const challenge = await adminService.createChallenge(req.adminId, req.body);
    res.status(201).json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
};

exports.updateChallenge = async (req, res, next) => {
  try {
    const challenge = await adminService.updateChallenge(req.params.id, req.body);
    res.json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
};

exports.deleteChallenge = async (req, res, next) => {
  try {
    const challenge = await adminService.deactivateChallenge(req.params.id);
    res.json({ success: true, message: 'Challenge deactivated', challenge });
  } catch (err) {
    next(err);
  }
};

exports.listTranslations = async (req, res, next) => {
  try {
    const translations = await adminService.listTranslations(req.params.id);
    res.json({ success: true, translations });
  } catch (err) {
    next(err);
  }
};

exports.addTranslation = async (req, res, next) => {
  try {
    const translations = await adminService.addTranslation(req.params.id, req.body);
    res.status(201).json({ success: true, translations });
  } catch (err) {
    next(err);
  }
};

exports.updateTranslation = async (req, res, next) => {
  try {
    const translations = await adminService.updateTranslation(req.params.id, req.params.language, req.body);
    res.json({ success: true, translations });
  } catch (err) {
    next(err);
  }
};

exports.getMetrics = async (req, res, next) => {
  try {
    const metrics = await analyticsService.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
};


exports.startExport = async (req, res, next) => {
  try {
    const job = await analyticsQueue.add('export', { requestedBy: req.adminId });
    res.status(202).json({ success: true, jobId: job.id });
  } catch (err) {
    next(err);
  }
};


exports.getExport = async (req, res, next) => {
  try {
    const job = await analyticsQueue.getJob(req.params.jobId);
    if (!job) throw new ApiError(404, 'Export job not found');

    const state = await job.getState();

    if (state === 'completed') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="imole-analytics.csv"');
      return res.send(job.returnvalue);
    }

    res.json({ success: true, state });
  } catch (err) {
    next(err);
  }
};