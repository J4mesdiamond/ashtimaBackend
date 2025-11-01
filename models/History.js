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
  weatherData: {
    aqi: {
      type: String,
      default: 'N/A',
    },
    pm25: {
      type: String,
      default: 'N/A',
    },
    pm10: {
      type: String,
      default: 'N/A',
    },
    no2: { // Assuming 'air' refers to NO2 based on the provided code
      type: String,
      default: 'N/A',
    },
    ozone: {
      type: String,
      default: 'N/A',
    },
    pollen: {
      type: String,
      default: 'N/A',
    },
    // NEW: Detailed pollen counts
    grass_pollen: {
      type: Number,
      default: null,
    },
    tree_pollen: {
      type: Number,
      default: null,
    },
    weed_pollen: {
      type: Number,
      default: null,
    },
    temperature: {
      type: Number,
      default: null,
    },
    humidity: {
      type: Number,
      default: null,
    },
    windSpeed: {
      type: Number,
      default: null,
    },
    windDirect: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      default: 'N/A',
    },
  },
  medicalFacilities: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries
historySchema.index({ userId: 1, createdAt: -1 });

export const History = mongoose.model('History', historySchema);