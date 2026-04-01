const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.get('/', authMiddleware, notificationController.getNotifications);

router.put('/read-all', authMiddleware, notificationController.markAllRead);

module.exports = router;