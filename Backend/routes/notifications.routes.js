const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notifications.controller');

// @route   GET /api/notifications
// @desc    Get all notifications for the user
// @access  Private
router.get('/', auth, getNotifications);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, markAllAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, markAsRead);

module.exports = router;
