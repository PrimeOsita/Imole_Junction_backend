const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Streak', streakSchema);