const SkillProgress = require('../models/SkillProgress');
const Submission = require('../models/Submission');
const Child = require('../models/Child');
const Streak = require('../models/Streak');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const { redisClient } = require('../Mongoose connection/redis');

const TOP_N = 50;
const CACHE_TTL_SECONDS = 300;
const PERIODS = ['weekly', 'all_time'];

const cacheKey = (period) => `leaderboard:${period}`;

// Turns [{ _id: childId, points }] into ranked LeaderboardEntry docs for one period.
async function rebuildPeriod(period, totals) {
  const childIds = totals.map((t) => t._id);

  const [children, streaks] = await Promise.all([
    Child.find({ _id: { $in: childIds } }).select('anonymousUsername').lean(),
    Streak.find({ childId: { $in: childIds } }).select('childId currentStreak').lean(),
  ]);

  const usernameById = new Map(children.map((c) => [String(c._id), c.anonymousUsername]));
  const streakById = new Map(streaks.map((s) => [String(s.childId), s.currentStreak]));

  const ranked = totals
    .filter((t) => usernameById.has(String(t._id)))
    .map((t) => ({
      childId: t._id,
      anonymousUsername: usernameById.get(String(t._id)),
      points: t.points,
      currentStreak: streakById.get(String(t._id)) || 0,
    }))
    // higher points first; a longer streak breaks ties
    .sort((a, b) => b.points - a.points || b.currentStreak - a.currentStreak)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  if (ranked.length) {
    await LeaderboardEntry.bulkWrite(
      ranked.map((entry) => ({
        updateOne: {
          filter: { childId: entry.childId, period },
          update: { $set: { ...entry, period } },
          upsert: true,
        },
      }))
    );
  }

  await LeaderboardEntry.deleteMany({ period, childId: { $nin: childIds } });

  await redisClient.del(cacheKey(period));
  return ranked.length;
}

async function recomputeLeaderboard() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const allTimeTotals = await SkillProgress.aggregate([
    { $group: { _id: '$childId', points: { $sum: '$score' } } },
  ]);

  // same scoring rule as childService: 10 points if correct, 5 otherwise
  const weeklyTotals = await Submission.aggregate([
    { $match: { submittedAt: { $gte: weekAgo } } },
    { $group: { _id: '$childId', points: { $sum: { $cond: ['$isCorrect', 10, 5] } } } },
  ]);

  const [allTimeCount, weeklyCount] = await Promise.all([
    rebuildPeriod('all_time', allTimeTotals),
    rebuildPeriod('weekly', weeklyTotals),
  ]);

  return { allTimeCount, weeklyCount };
}

async function getLeaderboard(period, childId) {
  if (!PERIODS.includes(period)) period = 'weekly';

  let top;
  const cached = await redisClient.get(cacheKey(period));

  if (cached) {
    top = JSON.parse(cached);
  } else {
    top = await LeaderboardEntry.find({ period })
      .sort({ rank: 1 })
      .limit(TOP_N)
      .select('rank anonymousUsername points currentStreak -_id')
      .lean();
    await redisClient.set(cacheKey(period), JSON.stringify(top), 'EX', CACHE_TTL_SECONDS);
  }

  const me = await LeaderboardEntry.findOne({ childId, period })
    .select('rank anonymousUsername points currentStreak -_id')
    .lean();

  return { period, top, me };
}

module.exports = { recomputeLeaderboard, getLeaderboard };