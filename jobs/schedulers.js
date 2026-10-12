const { streakQueue, leaderboardQueue } = require('./queues');


async function registerSchedules() {
    // every day at 00:05 — reset streaks for children who missed a day
  await streakQueue.upsertJobScheduler('nightly-streak-reset', { pattern: '5 0 * * *' }, { name: 'reset' });

  // every 5 minutes — rebuild ranks (matches the 5 min Redis cache TTL)
  await leaderboardQueue.upsertJobScheduler('leaderboard-refresh', { every: 5 * 60 * 1000 }, { name: 'refresh' });
}

module.exports = { registerSchedules };