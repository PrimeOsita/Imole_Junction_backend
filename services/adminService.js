const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Challenge = require('../models/Challenge');
const { env } = require('../config/env');
const { ApiError } = require('../middlewares/errorHandler');

// async function loginAdmin({ email, password }) {
//   const admin = await Admin.findOne({ email });
//   const passwordMatches = admin && (await bcrypt.compare(password, admin.passwordHash));
async function loginAdmin({ email, password }) {
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  const passwordMatches = admin && (await bcrypt.compare(password, admin.passwordHash));

  if (!passwordMatches) throw new ApiError(401, 'Invalid credentials.');
  if (admin.isActive === false) throw new ApiError(401, 'This admin account is no longer active.');

  // ...the rest (jwt.sign and the return) stays exactly as it was

  if (!passwordMatches) throw new ApiError(401, 'Invalid credentials.');

  const token = jwt.sign({ id: admin._id, type: 'admin', role: admin.role }, env.adminJwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return { admin: { id: admin._id, name: admin.name, role: admin.role }, token };
}

async function listChallenges({ skillId, difficulty, isActive, page = 1, limit = 20 }) {
  const filter = {};
  if (skillId) filter.skillId = skillId;
  if (difficulty) filter.difficulty = difficulty;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const safeLimit = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Challenge.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Challenge.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: safeLimit };
}

async function getChallenge(id) {
  const challenge = await Challenge.findById(id);
  if (!challenge) throw new ApiError(404, 'Challenge not found');
  return challenge;
}

async function createChallenge(adminId, data) {
  return Challenge.create({ ...data, createdBy: adminId });
}

async function updateChallenge(id, updates) {
  const challenge = await Challenge.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!challenge) throw new ApiError(404, 'Challenge not found');
  return challenge;
}


async function deactivateChallenge(id) {
  return updateChallenge(id, { isActive: false });
}

async function listTranslations(id) {
  const challenge = await getChallenge(id);
  return challenge.translations;
}

async function addTranslation(id, translation) {
  const challenge = await getChallenge(id);

  if (challenge.translations.some((t) => t.language === translation.language)) {
    throw new ApiError(409, `A "${translation.language}" translation already exists. Use PATCH to edit it.`);
  }

  challenge.translations.push(translation);
  await challenge.save();
  return challenge.translations;
}

async function updateTranslation(id, language, updates) {
  const challenge = await getChallenge(id);
  const translation = challenge.translations.find((t) => t.language === language);
  if (!translation) throw new ApiError(404, `No "${language}" translation on this challenge.`);

  Object.assign(translation, updates);
  await challenge.save();
  return challenge.translations;
}

module.exports = {
  loginAdmin,
  listChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deactivateChallenge,
  listTranslations,
  addTranslation,
  updateTranslation,
};