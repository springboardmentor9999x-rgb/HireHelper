const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOTP);

// POST /api/auth/resend-otp
router.post('/resend-otp', authController.resendOTP);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/verify-password-reset-otp
router.post('/verify-password-reset-otp', authController.verifyPasswordResetOTP);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
