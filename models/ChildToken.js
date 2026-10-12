const mongoose = require('mongoose');

const childTokenSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChildToken', childTokenSchema);