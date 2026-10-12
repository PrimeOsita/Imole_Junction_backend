const express = require('express');
const { childRoutes } = require('../child.routes');
const { parentRoutes } = require('../parent.routes');
const { adminRoutes } = require('../admin.routes');
const { skillRoutes } = require('../skillRoutes');

const router = express.Router();

router.use(childRoutes);
router.use(parentRoutes);
router.use(adminRoutes);
router.use(skillRoutes);
module.exports = { v1Router: router };