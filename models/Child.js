const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 8, max: 16 },
    preferredLanguage: {
      type: String,
      enum: ['en', 'yo', 'pcm'],
      default: 'en',
    },
    anonymousUsername: { type: String, required: true, unique: true },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

module.exports = mongoose.model('Child', childSchema);