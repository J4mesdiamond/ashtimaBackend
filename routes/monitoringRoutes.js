import express from 'express';
const router = express.Router();
import { getNotifications, getUnreadCount, getUserMonitors, markAllAsRead, markAsRead, startMonitoring, stopMonitoring } from '../controllers/monitoringController.js';
import { protect } from '../middlewares/authMiddleware.js';


// All routes require authentication
router.use(protect);

// Start monitoring
router.post('/start', startMonitoring);

// Stop monitoring
router.patch('/stop/:monitorId', stopMonitoring);

// Get all monitors for user
router.get('/', getUserMonitors);

// Get unread notifications count
router.get('/notifications/unread-count', getUnreadCount);

// Get all notifications
router.get('/notifications', getNotifications);

// Mark notification as read
router.patch('/notifications/:monitorId/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/notifications/mark-all-read', markAllAsRead);

export { router as monitoringRoutes};