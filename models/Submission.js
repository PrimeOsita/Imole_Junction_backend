const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    dailyAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyAssignment',
      required: true,
      index: true,
    },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    responseText: { type: String },
    selectedOption: { type: String },
    isCorrect: { type: Boolean, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);