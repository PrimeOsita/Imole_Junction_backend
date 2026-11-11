const express = require('express');
const parentController = require('../controllers/Parent/parentController');
const subscriptionController = require('../controllers/Parent/subscriptionController');
const { parentAuth } = require('../middlewares/parentAuth');
const { validate } = require('../middlewares/validate');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const {
  registerParentSchema,
  loginParentSchema,
  verifyParentEmailSchema,
  resendParentEmailOtpSchema,
  linkChildSchema,
} = require('../validators/parentValidators');
const {
  startPremiumCheckoutSchema,
  verifyPremiumPaymentSchema,
} = require('../validators/subscriptionValidators');

const router = express.Router();

router.post('/parents/register', validate(registerParentSchema), parentController.register);
// router.post('/parents/login', validate(loginParentSchema), parentController.login);
router.post(
  '/parents/login',
  authRateLimiter,
  validate(loginParentSchema),
  parentController.login
);
router.post(
  '/parents/verify-email',
  validate(verifyParentEmailSchema),
  parentController.verifyEmail
);
router.post(
  '/parents/resend-otp',
  validate(resendParentEmailOtpSchema),
  parentController.resendEmailOtp
);
router.post('/parents/link-child', parentAuth, validate(linkChildSchema), parentController.linkChild);
router.get('/parents/children', parentAuth, parentController.listChildren);
router.get('/parents/children/:childId/progress', parentAuth, parentController.getChildProgress);
router.get('/parents/children/:childId/share-card', parentAuth, parentController.getShareCard);
router.get('/parents/children/:childId/certificates', parentAuth, parentController.getCertificates);
router.get('/parents/subscription', parentAuth, subscriptionController.getStatus);
router.post(
  '/parents/subscription/checkout',
  parentAuth,
  validate(startPremiumCheckoutSchema),
  subscriptionController.createCheckout
);
router.post(
  '/parents/subscription/verify',
  parentAuth,
  validate(verifyPremiumPaymentSchema),
  subscriptionController.verifyPayment
);
router.post(
  '/parents/subscription/cancel',
  parentAuth,
  subscriptionController.cancel
);
router.post('/webhooks/flutterwave', subscriptionController.webhook);

module.exports = { parentRoutes: router };