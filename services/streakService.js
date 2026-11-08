const Streak = require('../models/Streak');

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function isYesterday(date, today) {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

async function registerActivityForStreak(childId) {
  const today = new Date();
  // let streak = await Streak.findOne({ childId });
  let query = Streak.findOne({ childId });

if (session) {
  query = query.session(session);
}

let streak = await query;

  if (!streak) {
 const created = await Streak.create(
  [{
    childId,
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: today,
  }],
  session ? { session } : {}
);
streak = created[0];

    return streak;
  }

  if (streak.lastActiveDate && isSameDay(streak.lastActiveDate, today)) {
    return streak; // already counted today
  }

  const continuesStreak = streak.lastActiveDate && isYesterday(streak.lastActiveDate, today);
  streak.currentStreak = continuesStreak ? streak.currentStreak + 1 : 1;
  streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
  streak.lastActiveDate = today;

  await streak.save(session ? { session } : {});
  return streak;
}


async function resetMissedStreaks() {
  const startOfYesterday = new Date();
  startOfYesterday.setHours(0, 0, 0, 0);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const result = await Streak.updateMany(
    { currentStreak: { $gt: 0 }, lastActiveDate: { $lt: startOfYesterday } },
    { $set: { currentStreak: 0 } }
  );

  return result.modifiedCount;
}

module.exports = { registerActivityForStreak, resetMissedStreaks };