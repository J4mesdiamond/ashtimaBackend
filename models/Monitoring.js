import mongoose from 'mongoose';

const monitoringSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  locationName: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCheckedData: {
    aqi: Number,
    pm25: Number,
    pm10: Number,
    no2: Number,
    ozone: Number,
    pollen: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    timestamp: Date
  },
  notifications: [{
    metric: String, // 'aqi', 'pm25', 'pm10', 'no2', 'ozone', 'pollen'
    changeType: String, // 'increase', 'decrease'
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for finding active monitors
monitoringSchema.index({ userId: 1, isActive: 1 });

export const Monitoring = mongoose.model('Monitoring', monitoringSchema);