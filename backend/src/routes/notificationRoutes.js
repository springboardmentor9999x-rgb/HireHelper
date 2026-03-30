const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

/**
 * Notification Routes
 * All routes protected with authentication middleware
 * NOTE: More specific routes (with named segments) must come before generic routes with :id
 */

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (MUST come before /:id routes)
 */
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

/**
 * POST /api/notifications/create
 * Create a new notification (admin/system use) (MUST come before /:id routes)
 */
router.post('/create', verifyToken, notificationController.createNotification);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read (MUST come before /:notificationId routes)
 */
router.put('/read-all', verifyToken, notificationController.markAllAsRead);

/**
 * PUT /api/notifications/read/:notificationId
 * Mark a notification as read
 */
router.put('/read/:notificationId', verifyToken, notificationController.markAsRead);

/**
 * GET /api/notifications
 * Get all notifications for logged-in user
 */
router.get('/', verifyToken, notificationController.getNotifications);

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', verifyToken, notificationController.deleteNotification);

module.exports = router;
