const express = require('express');
const childController = require('../controllers/child/childController');
const { childAuth } = require('../middlewares/childAuth');
const { submitRateLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validate');
const {
  createChildSchema,
  updateChildSchema,
  submitChallengeSchema,
} = require('../validators/childValidators');

const router = express.Router();


router.post('/children', validate(createChildSchema), childController.createChild);


router.get('/children/me', childAuth, childController.getMe);
router.patch('/children/me', childAuth, validate(updateChildSchema), childController.updateMe);
router.get('/children/me/challenge/today', childAuth, childController.getTodayChallenge);
router.post('/children/me/challenge/today/swap', childAuth, childController.swapTodayChallenge);
router.post(
  '/children/me/challenge/today/submit',
  childAuth,
  submitRateLimiter,
  validate(submitChallengeSchema),
  childController.submitTodayChallenge
);
router.get('/children/me/streak', childAuth, childController.getStreak);
router.get('/children/me/progress', childAuth, childController.getProgress);
router.post('/children/me/link-code', childAuth, childController.createLinkCode);

router.get('/leaderboard', childAuth, childController.getLeaderboard);

module.exports = { childRoutes: router };