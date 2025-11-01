import axios from 'axios';
import { Monitoring } from '../models/Monitoring.js';

const AMBEE_API_KEY = process.env.AMBEE_API_KEY;
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Thresholds for significant changes (can be customized)
const CHANGE_THRESHOLDS = {
  aqi: 2,        
  pm25: 1,       
  pm10: 2,       
  no2: 2,        
  ozone: 1,       
  temperature: 1, 
  humidity: 2,  
  windSpeed: 1    
};

// Start monitoring for a user
const startMonitoring = async (req, res) => {
  try {
    const { locationName, latitude, longitude, currentData } = req.body;

    // Check if user already has an active monitor for this location
    let monitor = await Monitoring.findOne({
      userId: req.user.id,
      locationName: locationName,
      isActive: true
    });

    if (monitor) {
      return res.json({
        success: true,
        message: 'Monitoring already active for this location',
        monitor
      });
    }

    // Create new monitoring record
    monitor = new Monitoring({
      userId: req.user.id,
      locationName,
      coordinates: {
        latitude,
        longitude
      },
      isActive: true,
      lastCheckedData: {
        aqi: currentData?.aqi,
        pm25: currentData?.pm25,
        pm10: currentData?.pm10,
        no2: currentData?.no2,
        ozone: currentData?.ozone,
        pollen: currentData?.pollen,
        temperature: currentData?.temperature,
        humidity: currentData?.humidity,
        windSpeed: currentData?.windSpeed,
        timestamp: new Date()
      },
      notifications: []
    });

    await monitor.save();

    res.json({
      success: true,
      message: 'Monitoring started successfully',
      monitor
    });
  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start monitoring'
    });
  }
};

// Stop monitoring
const stopMonitoring = async (req, res) => {
  try {
    const { monitorId } = req.params;

    const monitor = await Monitoring.findOneAndUpdate(
      { _id: monitorId, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found'
      });
    }

    res.json({
      success: true,
      message: 'Monitoring stopped successfully',
      monitor
    });
  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop monitoring'
    });
  }
};

// Get all monitors for user
const getUserMonitors = async (req, res) => {
  try {
    const monitors = await Monitoring.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      monitors
    });
  } catch (error) {
    console.error('Get monitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monitors'
    });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const monitors = await Monitoring.find({ 
      userId: req.user.id,
      'notifications.read': false 
    });

    let unreadCount = 0;
    monitors.forEach(monitor => {
      unreadCount += monitor.notifications.filter(n => !n.read).length;
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const monitors = await Monitoring.find({ userId: req.user.id })
      .sort({ 'notifications.timestamp': -1 });

    // Flatten all notifications from all monitors
    let allNotifications = [];
    monitors.forEach(monitor => {
      monitor.notifications.forEach(notification => {
        allNotifications.push({
          _id: notification._id,
          monitorId: monitor._id,
          locationName: monitor.locationName,
          metric: notification.metric,
          changeType: notification.changeType,
          oldValue: notification.oldValue,
          newValue: notification.newValue,
          message: notification.message,
          read: notification.read,
          timestamp: notification.timestamp
        });
      });
    });

    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      notifications: allNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { monitorId, notificationId } = req.params;

    const monitor = await Monitoring.findOne({
      _id: monitorId,
      userId: req.user.id
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found'
      });
    }

    const notification = monitor.notifications.id(notificationId);
    if (notification) {
      notification.read = true;
      await monitor.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Monitoring.updateMany(
      { userId: req.user.id },
      { $set: { 'notifications.$[].read': true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Background job to check monitors (should be called by a cron job)
const checkAllMonitors = async () => {
  try {
    const activeMonitors = await Monitoring.find({ isActive: true });

    console.log(`Checking ${activeMonitors.length} active monitors...`);

    for (const monitor of activeMonitors) {
      try {
        // Fetch current weather data from Ambee API
        const { latitude, longitude } = monitor.coordinates;
        
        // You'll need to implement the actual Ambee API call here
        const currentData = await fetchAmbeeData(latitude, longitude);

        // Compare with last checked data
        const changes = detectChanges(monitor.lastCheckedData, currentData);

        // Add notifications for significant changes
        if (changes.length > 0) {
          for (const change of changes) {
            monitor.notifications.push({
              metric: change.metric,
              changeType: change.changeType,
              oldValue: change.oldValue,
              newValue: change.newValue,
              message: change.message,
              read: false,
              timestamp: new Date()
            });
          }

          // Keep only last 100 notifications per monitor
          if (monitor.notifications.length > 100) {
            monitor.notifications = monitor.notifications.slice(-100);
          }
        }

        // Update last checked data
        monitor.lastCheckedData = {
          ...currentData,
          timestamp: new Date()
        };

        await monitor.save();
      } catch (error) {
        console.error(`Error checking monitor ${monitor._id}:`, error);
      }
    }

    console.log('Monitor check completed');
  } catch (error) {
    console.error('Check all monitors error:', error);
  }
};

// Helper function to fetch data from Ambee API
async function fetchAmbeeData(latitude, longitude) {
  // Implement your actual Ambee API calls here
  // This is a placeholder structure
  try {
    const airQualityResponse = await axios.get(
      `https://api.ambeedata.com/latest/by-lat-lng`,
      {
        headers: { 'x-api-key': AMBEE_API_KEY },
        params: { lat: latitude, lng: longitude }
      }
    );

    // Parse and return the data in your format
    return {
      aqi: airQualityResponse.data?.aqi,
      pm25: airQualityResponse.data?.pm25,
      pm10: airQualityResponse.data?.pm10,
      no2: airQualityResponse.data?.no2,
      ozone: airQualityResponse.data?.ozone,
      pollen: airQualityResponse.data?.pollen,
      temperature: airQualityResponse.data?.temperature,
      humidity: airQualityResponse.data?.humidity,
      windSpeed: airQualityResponse.data?.windSpeed
    };
  } catch (error) {
    console.error('Fetch Ambee data error:', error);
    throw error;
  }
}

// Helper function to detect significant changes
function detectChanges(oldData, newData) {
  const changes = [];

  const metrics = ['aqi', 'pm25', 'pm10', 'no2', 'ozone', 'temperature', 'humidity', 'windSpeed'];

  for (const metric of metrics) {
    const oldValue = oldData?.[metric];
    const newValue = newData?.[metric];

    if (oldValue !== undefined && newValue !== undefined) {
      const difference = Math.abs(newValue - oldValue);
      const threshold = CHANGE_THRESHOLDS[metric] || 0;

      if (difference >= threshold) {
        const changeType = newValue > oldValue ? 'increase' : 'decrease';
        const changeWord = changeType === 'increase' ? 'increased' : 'decreased';
        
        changes.push({
          metric,
          changeType,
          oldValue,
          newValue,
          message: `${metric.toUpperCase()} has ${changeWord} from ${oldValue} to ${newValue}`
        });
      }
    }
  }

  // Handle pollen separately (string values)
  if (oldData?.pollen && newData?.pollen && oldData.pollen !== newData.pollen) {
    const pollenLevels = ['Low', 'Moderate', 'High'];
    const oldIndex = pollenLevels.indexOf(oldData.pollen);
    const newIndex = pollenLevels.indexOf(newData.pollen);
    
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const changeType = newIndex > oldIndex ? 'increase' : 'decrease';
      const changeWord = changeType === 'increase' ? 'increased' : 'decreased';
      
      changes.push({
        metric: 'pollen',
        changeType,
        oldValue: oldData.pollen,
        newValue: newData.pollen,
        message: `Pollen levels have ${changeWord} from ${oldData.pollen} to ${newData.pollen}`
      });
    }
  }

  return changes;
}

export{
    startMonitoring,
    stopMonitoring,
    getUserMonitors,
    getUnreadCount,
    getNotifications,
    markAsRead,
    markAllAsRead,
    checkAllMonitors
}