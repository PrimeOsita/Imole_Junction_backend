const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    FirstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    LastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    ageRange: { 
      type: String,
      enum: ['6-9', '10-13', '14-17'],
      required: true
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'yo', 'pcm'],
      default: 'en',
    },
    anonymousUsername: { type: String, required: true, unique: true, select: false },
    UserName: { type: String, required: true, unique: true },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

module.exports = mongoose.model('Child', childSchema);