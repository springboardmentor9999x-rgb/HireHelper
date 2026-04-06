const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const verifyToken = require('../middleware/authMiddleware');

/**
 * User Routes
 */

/**
 * GET /api/users/me
 * Get logged-in user's profile (alias for /api/profile/me)
 */
router.get('/me', verifyToken, profileController.getProfile);

/**
 * PUT /api/users/me
 * Update user profile (alias for /api/profile/update)
 */
router.put('/me', verifyToken, profileController.updateProfile);

module.exports = router;