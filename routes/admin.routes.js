const express = require('express');
const adminController = require('../controllers/Admin/adminController');
const { adminAuth } = require('../middlewares/adminAuth');
const { validate } = require('../middlewares/validate');
const {
  adminLoginSchema,
  createChallengeSchema,
  updateChallengeSchema,
  translationSchema,
  updateTranslationSchema,
} = require('../validators/adminValidators');

const router = express.Router();

router.post('/admin/login', validate(adminLoginSchema), adminController.login);

router.get('/admin/challenges', adminAuth(), adminController.listChallenges);
router.post('/admin/challenges', adminAuth(), validate(createChallengeSchema), adminController.createChallenge);
router.get('/admin/challenges/:id', adminAuth(), adminController.getChallenge);
router.patch('/admin/challenges/:id', adminAuth(), validate(updateChallengeSchema), adminController.updateChallenge);
router.delete('/admin/challenges/:id', adminAuth(), adminController.deleteChallenge);


router.get('/admin/challenges/:id/translations', adminAuth(), adminController.listTranslations);
router.post('/admin/challenges/:id/translations', adminAuth(), validate(translationSchema), adminController.addTranslation);
router.patch(
  '/admin/challenges/:id/translations/:language',
  adminAuth(),
  validate(updateTranslationSchema),
  adminController.updateTranslation
);


router.get('/admin/metrics', adminAuth('super_admin'), adminController.getMetrics);
router.get('/admin/analytics/export', adminAuth('super_admin'), adminController.startExport);
router.get('/admin/analytics/export/:jobId', adminAuth('super_admin'), adminController.getExport);

module.exports = { adminRoutes: router };