/**
 * Settings Routes
 * All routes are protected with JWT authentication
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const verifyToken = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * Get current user settings
 * GET /api/settings
 */
router.get('/', settingsController.getSettings);

/**
 * Update user profile information
 * PUT /api/settings/profile
 * Body: { first_name, last_name, phone_number, bio, profile_picture }
 */
router.put('/profile', settingsController.updateProfile);

/**
 * Update notification preferences
 * PUT /api/settings/notifications
 * Body: { task_requests: boolean, task_updates: boolean, announcements: boolean }
 */
router.put('/notifications', settingsController.updateNotifications);

/**
 * Update appearance settings (dark mode)
 * PUT /api/settings/appearance
 * Body: { dark_mode: boolean }
 */
router.put('/appearance', settingsController.updateAppearance);

/**
 * Update theme preferences (dark mode) - legacy endpoint
 * PUT /api/settings/theme
 * Body: { dark_mode: boolean }
 */
router.put('/theme', settingsController.updateTheme);

/**
 * Update language preference
 * PUT /api/settings/language
 * Body: { language: 'English' | 'Telugu' | 'Hindi' }
 */
router.put('/language', settingsController.updateLanguage);

/**
 * Update privacy settings
 * PUT /api/settings/privacy
 * Body: { profile_visibility: boolean }
 */
router.put('/privacy', settingsController.updatePrivacy);

/**
 * Change user password
 * PUT /api/settings/password
 * Body: { current_password: string, new_password: string, confirm_password: string }
 */
router.put('/password', settingsController.changePassword);

/**
 * Change user password (legacy endpoint)
 * PUT /api/settings/change-password
 * Body: { current_password: string, new_password: string }
 */
router.put('/change-password', settingsController.changePassword);

/**
 * Delete user account
 * DELETE /api/settings/delete-account
 * Body: { password: string }
 */
router.delete('/delete-account', settingsController.deleteAccount);

module.exports = router;
