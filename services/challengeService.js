// const Skill = require('../models/Skill');
// const Challenge = require('../models/Challenge');
// const DailyAssignment = require('../models/DailyAssignment');
// const Submission = require('../models/Submission');
// const { ApiError } = require('../middlewares/errorHandler');

// async function pickNextSkill(childId) {
//   const skills = await Skill.find().sort({ slug: 1 });
//   if (!skills.length) throw new ApiError(500, 'No skills seeded — run the seeder');

//   const assignmentCount = await DailyAssignment.countDocuments({ childId });
//   return skills[assignmentCount % skills.length];
// }

// async function pickChallengeForSkill(childId, skillId) {
//   const seenAssignmentIds = await Submission.find({ childId }).distinct('dailyAssignmentId');
//   const seenChallengeIds = await DailyAssignment.find({ _id: { $in: seenAssignmentIds } }).distinct('challengeId');

//   const unseen = await Challenge.aggregate([
//     { $match: { skillId, isActive: true, _id: { $nin: seenChallengeIds } } },
//     { $sample: { size: 1 } },
//   ]);

//   if (unseen.length) return unseen[0];

//   const fallback = await Challenge.aggregate([
//     { $match: { skillId, isActive: true } },
//     { $sample: { size: 1 } },
//   ]);

//   if (!fallback.length) throw new ApiError(500, 'No active challenges for this skill — seed more');

//   return fallback[0];
// }

// async function assignDailyChallenge(childId) {
//   const skill = await pickNextSkill(childId);
//   const challenge = await pickChallengeForSkill(childId, skill._id);

//   const startOfDay = new Date();
//   startOfDay.setHours(0, 0, 0, 0);

//   const assignment = await DailyAssignment.findOneAndUpdate(
//     { childId, assignedDate: { $gte: startOfDay } },
//     { $setOnInsert: { childId, challengeId: challenge._id, assignedDate: new Date() } },
//     { upsert: true, new: true }
//   );

//   return assignment;
// }

// module.exports = { assignDailyChallenge };

const Skill = require('../models/Skill');
const Challenge = require('../models/Challenge');
const DailyAssignment = require('../models/DailyAssignment');
const Submission = require('../models/Submission');
const { ApiError } = require('../middlewares/errorHandler');

// How many times a child can swap today's question before answering.
const MAX_SWAPS_PER_DAY = 2;

// Picks the "next" skill for a child by rotating through the 5 skills in a
// fixed order based on how many total assignments they've had so far.
async function pickNextSkill(childId) {
  const skills = await Skill.find().sort({ slug: 1 });
  if (!skills.length) throw new ApiError(500, 'No skills seeded — run the seeder');

  const assignmentCount = await DailyAssignment.countDocuments({ childId });
  return skills[assignmentCount % skills.length];
}

// Picks a challenge for a skill the child hasn't seen yet, falling back to
// any active one if they've exhausted the pool. excludeIds are challenges
// that must NOT come back (today's current one and ones already swapped away).
async function pickChallengeForSkill(childId, skillId, excludeIds = []) {
  const seenAssignmentIds = await Submission.find({ childId }).distinct('dailyAssignmentId');
  const seenChallengeIds = await DailyAssignment.find({ _id: { $in: seenAssignmentIds } }).distinct('challengeId');

  const unseen = await Challenge.aggregate([
    { $match: { skillId, isActive: true, _id: { $nin: [...seenChallengeIds, ...excludeIds] } } },
    { $sample: { size: 1 } },
  ]);

  if (unseen.length) return unseen[0];

  const fallback = await Challenge.aggregate([
    { $match: { skillId, isActive: true, _id: { $nin: excludeIds } } },
    { $sample: { size: 1 } },
  ]);

  if (!fallback.length) {
    throw excludeIds.length
      ? new ApiError(409, 'There are no other challenges available for this skill right now.')
      : new ApiError(500, 'No active challenges for this skill — seed more');
  }

  return fallback[0];
}

async function assignDailyChallenge(childId) {
  const skill = await pickNextSkill(childId);
  const challenge = await pickChallengeForSkill(childId, skill._id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const assignment = await DailyAssignment.findOneAndUpdate(
    { childId, assignedDate: { $gte: startOfDay } },
    { $setOnInsert: { childId, challengeId: challenge._id, assignedDate: new Date() } },
    { upsert: true, new: true }
  );

  return assignment;
}

// Replaces today's challenge with a different one from the same skill.
async function swapDailyChallenge(childId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const assignment = await DailyAssignment.findOne({ childId, assignedDate: { $gte: startOfDay } });
  if (!assignment) throw new ApiError(404, 'No challenge has been assigned today yet');

  if (assignment.locked) {
    throw new ApiError(409, "You've already answered today's challenge, so it can't be changed");
  }
  if (assignment.swapCount >= MAX_SWAPS_PER_DAY) {
    throw new ApiError(409, `You've used all ${MAX_SWAPS_PER_DAY} swaps for today`);
  }

  const current = await Challenge.findById(assignment.challengeId);
  const excludeIds = [assignment.challengeId, ...assignment.skippedChallengeIds];
  const next = await pickChallengeForSkill(childId, current.skillId, excludeIds);

  assignment.skippedChallengeIds.push(assignment.challengeId);
  assignment.challengeId = next._id;
  assignment.swapCount += 1;
  await assignment.save();

  return assignment;
}

module.exports = { MAX_SWAPS_PER_DAY, assignDailyChallenge, swapDailyChallenge };