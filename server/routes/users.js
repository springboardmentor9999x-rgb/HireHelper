const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('./middleware/authmiddleware');

router.get('/:id/profile', authMiddleware, userController.getUserProfile);

module.exports = router;
