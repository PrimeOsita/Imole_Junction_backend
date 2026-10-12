const express = require('express');
const parentController = require('../controllers/Parent/parentController');
const { parentAuth } = require('../middlewares/parentAuth');
const { validate } = require('../middlewares/validate');
const {
  registerParentSchema,
  loginParentSchema,
  linkChildSchema,
} = require('../validators/parentValidators');

const router = express.Router();

router.post('/parents/register', validate(registerParentSchema), parentController.register);
router.post('/parents/login', validate(loginParentSchema), parentController.login);

router.post('/parents/link-child', parentAuth, validate(linkChildSchema), parentController.linkChild);
router.get('/parents/children', parentAuth, parentController.listChildren);
router.get('/parents/children/:childId/progress', parentAuth, parentController.getChildProgress);
router.get('/parents/children/:childId/share-card', parentAuth, parentController.getShareCard);
router.get('/parents/children/:childId/certificates', parentAuth, parentController.getCertificates);

module.exports = { parentRoutes: router };