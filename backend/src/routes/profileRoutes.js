const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");

// Configure multer for profile picture uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const uploadProfile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

/**
 * Profile Routes - All routes require authentication
 */

/**
 * GET /api/profile/me
 * Get logged-in user's profile
 */
router.get("/me", verifyToken, profileController.getProfile);

/**
 * PUT /api/profile/me
 * Update user profile (first_name, last_name, phone_number, profile_picture)
 */
router.put("/me", verifyToken, profileController.updateProfile);

/**
 * PUT /api/profile/update
 * Update user profile (first_name, last_name, phone_number) - deprecated, use PUT /me
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
router.post("/upload-picture", verifyToken, uploadProfile.single('image'), profileController.uploadProfilePicture);

/**
 * DELETE /api/profile/picture
 * Delete profile picture
 */
router.delete("/picture", verifyToken, profileController.deleteProfilePicture);

module.exports = router;