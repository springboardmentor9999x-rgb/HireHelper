const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");

/**
 * Profile Routes - All routes require authentication
 */

/**
 * GET /api/profile/me
 * Get logged-in user's profile
 */
router.get("/me", verifyToken, profileController.getProfile);

/**
 * PUT /api/profile/update
 * Update user profile (first_name, last_name, phone_number)
 */
router.put("/update", verifyToken, profileController.updateProfile);

/**
 * PUT /api/profile/change-password
 * Change user password
 */
router.put("/change-password", verifyToken, profileController.changePassword);

/**
 * POST /api/profile/upload-picture
 * Upload profile picture
 */
router.post("/upload-picture", verifyToken, profileController.uploadProfilePicture);

/**
 * DELETE /api/profile/picture
 * Delete profile picture
 */
router.delete("/picture", verifyToken, profileController.deleteProfilePicture);

module.exports = router;