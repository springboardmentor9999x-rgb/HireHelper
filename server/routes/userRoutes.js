const express = require("express");
const router = express.Router();
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");

// Multer config for profile picture
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, "profile-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Get profile
router.get("/profile", protect, getProfile);

// Update profile
router.put("/profile", protect, upload.single("profile_picture"), updateProfile);

// Change password
router.put("/change-password", protect, changePassword);

module.exports = router;
