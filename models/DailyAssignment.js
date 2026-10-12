const mongoose = require('mongoose');

const dailyAssignmentSchema = new mongoose.Schema({
    childId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Child', 
      required: true 
    },
    challengeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Challenge', 
      required: true 
    },
    assignedDate: { 
      type: Date, 
      required: true 
    },
    locked: { 
      type: Boolean, 
      default: false 
    },
    completedAt: { 
      type: Date, 
      default: null 
    },
    swapCount: { 
      type: Number, 
      default: 0 
    },
    skippedChallengeIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Challenge' 
    }],
  },
  { timestamps: true }
);


dailyAssignmentSchema.index({ childId: 1, assignedDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyAssignment', dailyAssignmentSchema);


// const dailyAssignmentSchema = new mongoose.Schema(
//   {
//     childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
//     challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
//     assignedDate: { type: Date, required: true },
//     locked: { type: Boolean, default: false },
//     completedAt: { type: Date, default: null },
//   },
//   { timestamps: true }
// );