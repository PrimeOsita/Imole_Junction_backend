const mongoose = require('mongoose');

const skillProgressSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    score: { type: Number, default: 0 },
    challengesCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

skillProgressSchema.index({ childId: 1, skillId: 1 }, { unique: true });

module.exports = mongoose.model('SkillProgress', skillProgressSchema);