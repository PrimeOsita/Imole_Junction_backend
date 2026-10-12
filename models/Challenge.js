const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    language: { type: String, enum: ['en', 'yo', 'pcm'], required: true },
    prompt: { type: String, required: true },
    options: { type: [String], default: undefined }, // only used for multiple_choice
    correctAnswer: { type: String },
  },
  { _id: false } // sub-document doesn't need its own _id
);

const challengeSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    type: { type: String, enum: ['text', 'multiple_choice'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    translations: {
      type: [translationSchema],
      validate: {
        validator: (translations) => translations.length > 0,
        message: 'A challenge must have at least one translation',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', challengeSchema);