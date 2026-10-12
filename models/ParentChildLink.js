const mongoose = require('mongoose');

const parentChildLinkSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    linkCode: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

parentChildLinkSchema.index({ parentId: 1, childId: 1 }, { unique: true });

module.exports = mongoose.model('ParentChildLink', parentChildLinkSchema);