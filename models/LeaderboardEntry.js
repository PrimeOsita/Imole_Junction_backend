const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    anonymousUsername: { type: String, required: true },
    points: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    period: { type: String, enum: ['weekly', 'all_time'], required: true },
    rank: { type: Number, required: true },
  },
  { timestamps: true }
);

leaderboardEntrySchema.index({ childId: 1, period: 1 }, { unique: true });
leaderboardEntrySchema.index({ period: 1, rank: 1 }); // fast "top N" reads

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);