const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register
router.post("/register", authController.register);

// Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Login
router.post("/login", authController.login);

// Forgot Password
router.post("/forgot-password", authController.forgotPassword);

// Reset Password
router.post("/reset-password", authController.resetPassword);

module.exports = router;
