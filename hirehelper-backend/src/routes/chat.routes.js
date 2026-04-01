const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');

router.post('/send', auth, chatController.sendMessage);
router.get('/messages', auth, chatController.getMessages);

module.exports = router;