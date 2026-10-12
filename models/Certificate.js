const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    title: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);