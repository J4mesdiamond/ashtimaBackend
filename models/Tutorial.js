// models/Tutorial.js
import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
  },
  thumbnailUrl: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['weather', 'air-quality', 'asthma-management', 'general'],
    default: 'general',
  },
  views: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
tutorialSchema.index({ category: 1, isActive: 1 });

export const Tutorial = mongoose.model('Tutorial', tutorialSchema);