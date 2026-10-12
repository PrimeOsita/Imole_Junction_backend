const Child = require('../models/Child');
const ChildToken = require('../models/ChildToken');
const DailyAssignment = require('../models/DailyAssignment');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const Streak = require('../models/Streak');
const SkillProgress = require('../models/SkillProgress');
const { generateChildToken, hashToken } = require('../utils/tokenGenerator');
const { generateAnonymousUsername } = require('../utils/anonymousUsername');
const { ApiError } = require('../middlewares/errorHandler');
const { MAX_SWAPS_PER_DAY, assignDailyChallenge, swapDailyChallenge } = require('./challengeService');
const { registerActivityForStreak } = require('./streakService');
const { CERTIFICATE_MILESTONE } = require('./certificateService');
const { certificateQueue } = require('../jobs/queues');

// Retries a few times on the rare event two children roll the same
// adjective+animal+number combo (the unique index is the real guarantee;
// this just avoids surfacing a raw duplicate-key error to the caller).
async function generateUniqueUsername() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateAnonymousUsername();
    const exists = await Child.exists({ anonymousUsername: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, 'Could not generate a unique username, try again');
}

// Picks the child's language, then English, then whatever exists.
function pickTranslation(challenge, language) {
  return (
    challenge.translations.find((t) => t.language === language) ||
    challenge.translations.find((t) => t.language === 'en') ||
    challenge.translations[0]
  );
}

const normalize = (value) => String(value || '').trim().toLowerCase();

async function createChild({ name, age, preferredLanguage }) {
  const anonymousUsername = await generateUniqueUsername();

  const child = await Child.create({ name, age, preferredLanguage, anonymousUsername });

  const rawToken = generateChildToken();
  await ChildToken.create({ childId: child._id, tokenHash: hashToken(rawToken) });

  await Streak.create({ childId: child._id });

  return { child, token: rawToken };
}

async function getChildById(childId) {
  const child = await Child.findById(childId);
  if (!child) throw new ApiError(404, 'Child not found');
  return child;
}

async function updateChild(childId, updates) {
  const allowedFields = ['name', 'preferredLanguage'];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  const child = await Child.findByIdAndUpdate(childId, safeUpdates, { new: true, runValidators: true });
  if (!child) throw new ApiError(404, 'Child not found');
  return child;
}

// Gets today's assignment for a child, creating one via challengeService if
// none exists yet. Returns the raw document (including answers), so it is
// only used INSIDE the backend — never send it straight to the client.
async function getTodayAssignment(childId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let assignment = await DailyAssignment.findOne({
    childId,
    assignedDate: { $gte: startOfDay },
  }).populate('challengeId');

  if (!assignment) {
    assignment = await assignDailyChallenge(childId);
    await assignment.populate('challengeId');
  }

  return assignment;
}

// The client-safe version: one language, and no correctAnswer.
async function getTodayChallenge(childId) {
  const child = await getChildById(childId);
  const assignment = await getTodayAssignment(childId);

  const challenge = assignment.challengeId;
  const translation = pickTranslation(challenge, child.preferredLanguage);

  return {
    assignmentId: assignment._id,
    locked: assignment.locked,
    completedAt: assignment.completedAt,
    challenge: {
      id: challenge._id,
      skillId: challenge.skillId,
      type: challenge.type,
      difficulty: challenge.difficulty,
      language: translation.language,
      prompt: translation.prompt,
      options: translation.options || [],
    },
  };
}

async function submitTodayChallenge(childId, { responseText, selectedOption }) {
  const child = await getChildById(childId);
  const assignment = await getTodayAssignment(childId);

  if (assignment.locked) {
    throw new ApiError(409, "Today's challenge has already been submitted");
  }

  const challenge = await Challenge.findById(assignment.challengeId._id);
  const translation = pickTranslation(challenge, child.preferredLanguage);

  if (challenge.type === 'multiple_choice' && !selectedOption) {
    throw new ApiError(400, 'selectedOption is required for this challenge');
  }
  if (challenge.type === 'text' && !responseText) {
    throw new ApiError(400, 'responseText is required for this challenge');
  }

  const isCorrect =
    challenge.type === 'multiple_choice'
      ? normalize(translation.correctAnswer) === normalize(selectedOption)
      : null; // free-text answers aren't auto-graded

  const pointsEarned = isCorrect ? 10 : 5;

  const submission = await Submission.create({
    dailyAssignmentId: assignment._id,
    childId,
    responseText,
    selectedOption,
    isCorrect,
  });

  assignment.locked = true;
  assignment.completedAt = new Date();
  await assignment.save();

  const progress = await SkillProgress.findOneAndUpdate(
    { childId, skillId: challenge.skillId },
    { $inc: { challengesCompleted: 1, score: pointsEarned } },
    { upsert: true, new: true }
  );

  // Hitting the milestone hands certificate creation to the background worker.
  // The jobId dedupes it, and a queue hiccup must never fail the submission.
  if (progress.challengesCompleted === CERTIFICATE_MILESTONE) {
    certificateQueue
      .add('issue', { childId, skillId: challenge.skillId }, { jobId: `cert-${childId}-${challenge.skillId}` })
      .catch((err) => console.error('Could not queue certificate job:', err.message));
  }

  const streak = await registerActivityForStreak(childId);

  return {
    submission,
    isCorrect,
    pointsEarned,
    // safe to reveal now that the challenge is locked for today
    correctAnswer: challenge.type === 'multiple_choice' ? translation.correctAnswer : null,
    streak,
  };
}

async function getStreak(childId) {
  const streak = await Streak.findOne({ childId });
  return {
    currentStreak: streak ? streak.currentStreak : 0,
    bestStreak: streak ? streak.bestStreak : 0,
    lastActiveDate: streak ? streak.lastActiveDate : null,
  };
}

async function getProgress(childId) {
  const [progress, recentSubmissions] = await Promise.all([
    SkillProgress.find({ childId }).populate('skillId', 'slug name'),
    Submission.find({ childId }).sort({ submittedAt: -1 }).limit(10).select('submittedAt isCorrect -_id'),
  ]);

  const totalCompleted = progress.reduce((sum, p) => sum + p.challengesCompleted, 0);
  const totalPoints = progress.reduce((sum, p) => sum + p.score, 0);

  return {
    totalCompleted,
    totalPoints,
    skills: progress.map((p) => ({
      skill: p.skillId,
      score: p.score,
      challengesCompleted: p.challengesCompleted,
    })),
    recentSubmissions,
  };
}
async function swapTodayChallenge(childId) {
  await getTodayAssignment(childId); // makes sure today's challenge exists first
  await swapDailyChallenge(childId);
  return getTodayChallenge(childId);
}

module.exports = {
  createChild,
  getChildById,
  updateChild,
  getTodayAssignment,
  getTodayChallenge,
  submitTodayChallenge,
  getStreak,
  getProgress,
  swapTodayChallenge,
  MAX_SWAPS_PER_DAY
};