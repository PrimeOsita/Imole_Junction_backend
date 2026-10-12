const childService = require('../../services/childService');
const parentService = require('../../services/parentService');
const leaderboardService = require('../../services/leaderboardService');

exports.createChild = async (req, res, next) => {
  try {
    const { name, age, preferredLanguage } = req.body;
    const { child, token } = await childService.createChild({ name, age, preferredLanguage });

    res.status(201).json({
      success: true,
      childId: child._id,
      anonymousUsername: child.anonymousUsername,
      token, 
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const child = await childService.getChildById(req.childId);
    res.json({ success: true, child });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const child = await childService.updateChild(req.childId, req.body);
    res.json({ success: true, child });
  } catch (err) {
    next(err);
  }
};

exports.getTodayChallenge = async (req, res, next) => {
  try {
    const today = await childService.getTodayChallenge(req.childId);
    res.json({ success: true, ...today });
  } catch (err) {
    next(err);
  }
};

exports.submitTodayChallenge = async (req, res, next) => {
  try {
    const { responseText, selectedOption } = req.body;
    const result = await childService.submitTodayChallenge(req.childId, { responseText, selectedOption });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
exports.swapTodayChallenge = async (req, res, next) => {
  try {
    const today = await childService.swapTodayChallenge(req.childId);
    res.json({ success: true, ...today });
  } catch (err) {
    next(err);
  }
};
exports.getStreak = async (req, res, next) => {
  try {
    const streak = await childService.getStreak(req.childId);
    res.json({ success: true, ...streak });
  } catch (err) {
    next(err);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const progress = await childService.getProgress(req.childId);
    res.json({ success: true, ...progress });
  } catch (err) {
    next(err);
  }
};

exports.createLinkCode = async (req, res, next) => {
  try {
    const result = await parentService.createLinkCode(req.childId);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await leaderboardService.getLeaderboard(req.query.period, req.childId);
    res.json({ success: true, ...leaderboard });
  } catch (err) {
    next(err);
  }
};