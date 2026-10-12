const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');
const Child = require('../models/Child');
const ParentChildLink = require('../models/ParentChildLink');
const Streak = require('../models/Streak');
const SkillProgress = require('../models/SkillProgress');
const Certificate = require('../models/Certificate');
const { env } = require('../config/env');
const { redisClient } = require('../Mongoose connection/redis');
const { generateLinkCode } = require('../utils/tokenGenerator');
const { ApiError } = require('../middlewares/errorHandler');

const LINK_CODE_TTL_SECONDS = 600; // a code is valid for 10 minutes
const linkKey = (code) => `linkcode:${code}`;

function signParentToken(parent) {
  return jwt.sign({ id: parent._id, type: 'parent' }, env.parentJwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function registerParent({ name, email, phone, password }) {
  const duplicate = await Parent.findOne({ $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean) });
  if (duplicate) throw new ApiError(409, 'An account with that email or phone already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const parent = await Parent.create({ name, email, phone, passwordHash });

  return { parent: { id: parent._id, name: parent.name, email: parent.email, phone: parent.phone }, token: signParentToken(parent) };
}

async function loginParent({ email, phone, password }) {
  const parent = await Parent.findOne(email ? { email } : { phone });
  const passwordMatches = parent && (await bcrypt.compare(password, parent.passwordHash));


  if (!passwordMatches) throw new ApiError(401, 'Invalid credentials.');

  return { parent: { id: parent._id, name: parent.name }, token: signParentToken(parent) };
}

async function createLinkCode(childId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const linkCode = generateLinkCode();
    const stored = await redisClient.set(linkKey(linkCode), String(childId), 'EX', LINK_CODE_TTL_SECONDS, 'NX');
    if (stored) return { linkCode, expiresInSeconds: LINK_CODE_TTL_SECONDS };
  }
  throw new ApiError(500, 'Could not generate a link code, try again');
}


async function linkChild(parentId, linkCode) {
  const code = linkCode.toUpperCase();
  const childId = await redisClient.get(linkKey(code));
  if (!childId) throw new ApiError(400, 'That link code is invalid or has expired.');

  await ParentChildLink.findOneAndUpdate(
    { parentId, childId },
    { $setOnInsert: { linkCode: code, linkedAt: new Date() } },
    { upsert: true }
  );
  await redisClient.del(linkKey(code)); // one-time use

  const child = await Child.findById(childId).select('name anonymousUsername age');
  return { child };
}

async function assertParentOwnsChild(parentId, childId) {
  const link = await ParentChildLink.exists({ parentId, childId });
  if (!link) throw new ApiError(403, 'This child is not linked to your account.');
}

async function listChildren(parentId) {
  const links = await ParentChildLink.find({ parentId }).populate('childId', 'name anonymousUsername age');
  return links.map((link) => link.childId);
}

async function getChildProgress(parentId, childId) {
  await assertParentOwnsChild(parentId, childId);

  const [child, streak, progress, certificates] = await Promise.all([
    Child.findById(childId).select('name age anonymousUsername preferredLanguage createdAt'),
    Streak.findOne({ childId }),
    SkillProgress.find({ childId }).populate('skillId', 'slug name'),
    Certificate.countDocuments({ childId }),
  ]);

  return {
    child,
    streak: { current: streak ? streak.currentStreak : 0, best: streak ? streak.bestStreak : 0 },
    skills: progress.map((p) => ({
      skill: p.skillId,
      score: p.score,
      challengesCompleted: p.challengesCompleted,
    })),
    certificatesEarned: certificates,
  };
}


async function getShareCard(parentId, childId) {
  const summary = await getChildProgress(parentId, childId);

  const totalCompleted = summary.skills.reduce((sum, s) => sum + s.challengesCompleted, 0);
  const totalPoints = summary.skills.reduce((sum, s) => sum + s.score, 0);
  const topSkill = [...summary.skills].sort((a, b) => b.score - a.score)[0];

  return {
    name: summary.child.name,
    currentStreak: summary.streak.current,
    bestStreak: summary.streak.best,
    totalCompleted,
    totalPoints,
    topSkill: topSkill ? topSkill.skill.name : null,
    certificatesEarned: summary.certificatesEarned,
    generatedAt: new Date(),
  };
}

async function getCertificates(parentId, childId) {
  await assertParentOwnsChild(parentId, childId);
  return Certificate.find({ childId }).populate('skillId', 'slug name').sort({ issuedAt: -1 });
}

module.exports = {
  registerParent,
  loginParent,
  createLinkCode,
  linkChild,
  listChildren,
  getChildProgress,
  getShareCard,
  getCertificates,
};