const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'mental_math',
        'persuasive_speaking',
        'financial_literacy',
        'creative_problem_solving',
        'emotional_intelligence',
      ],
    },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);