const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('./middleware/authmiddleware');

router.use(authMiddleware);

// GET /api/notifications - Get all notifications for the current user
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
