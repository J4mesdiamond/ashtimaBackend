// models/History.js
import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
}, {
  timestamps: true,
});

// Index for faster queries
historySchema.index({ userId: 1, createdAt: -1 });

export const History = mongoose.model('History', historySchema);