const Child = require('../models/Child');
const Streak = require('../models/Streak');
const SkillProgress = require('../models/SkillProgress');
const Submission = require('../models/Submission');
const DailyAssignment = require('../models/DailyAssignment');

function daysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

async function getMetrics() {
  const startOfToday = daysAgo(0);
  const thirtyDaysAgo = daysAgo(30);

  const [totalChildren, dailyActive, monthlyActive, todayAssignments, todayCompletions, streakStats] =
    await Promise.all([
      Child.countDocuments(),
      Submission.distinct('childId', { submittedAt: { $gte: startOfToday } }),
      Submission.distinct('childId', { submittedAt: { $gte: thirtyDaysAgo } }),
      DailyAssignment.countDocuments({ assignedDate: { $gte: startOfToday } }),
      DailyAssignment.countDocuments({ assignedDate: { $gte: startOfToday }, locked: true }),
      Streak.aggregate([
        {
          $group: {
            _id: null,
            averageCurrentStreak: { $avg: '$currentStreak' },
            longestStreak: { $max: '$bestStreak' },
          },
        },
      ]),
    ]);

  const stats = streakStats[0] || { averageCurrentStreak: 0, longestStreak: 0 };

  return {
    totalChildren,
    dau: dailyActive.length,
    mau: monthlyActive.length,
    todayAssignments,
    todayCompletions,
    completionRate: todayAssignments ? Number((todayCompletions / todayAssignments).toFixed(2)) : 0,
    averageCurrentStreak: Number(stats.averageCurrentStreak.toFixed(2)),
    longestStreak: stats.longestStreak,
  };
}

const csvCell = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

async function buildAnalyticsCsv() {
  const [children, streaks, progress] = await Promise.all([
    Child.find().lean(),
    Streak.find().lean(),
    SkillProgress.aggregate([
      {
        $group: {
          _id: '$childId',
          totalCompleted: { $sum: '$challengesCompleted' },
          totalPoints: { $sum: '$score' },
        },
      },
    ]),
  ]);

  const streakById = new Map(streaks.map((s) => [String(s.childId), s]));
  const progressById = new Map(progress.map((p) => [String(p._id), p]));

  const header = [
    'childId', 'anonymousUsername', 'age', 'language', 'joinedAt',
    'currentStreak', 'bestStreak', 'totalCompleted', 'totalPoints',
  ];

  const rows = children.map((child) => {
    const streak = streakById.get(String(child._id)) || {};
    const totals = progressById.get(String(child._id)) || {};
    return [
      child._id, child.anonymousUsername, child.age, child.preferredLanguage,
      child.createdAt.toISOString(), streak.currentStreak || 0, streak.bestStreak || 0,
      totals.totalCompleted || 0, totals.totalPoints || 0,
    ];
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

module.exports = { getMetrics, buildAnalyticsCsv };