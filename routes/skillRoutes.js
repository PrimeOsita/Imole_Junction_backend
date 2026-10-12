const express = require('express');
const skillController = require('../controllers/skill/skillController');

const router = express.Router();

router.get('/skills', skillController.listSkills);
router.get('/skills/:id', skillController.getSkillById);

module.exports = { skillRoutes: router };