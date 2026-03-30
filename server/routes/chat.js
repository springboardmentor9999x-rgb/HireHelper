const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('./middleware/authmiddleware');

// All chat routes are protected
router.post('/send', authMiddleware, chatController.sendMessage);
router.get('/:requestId', authMiddleware, chatController.getChatHistory);

module.exports = router;
