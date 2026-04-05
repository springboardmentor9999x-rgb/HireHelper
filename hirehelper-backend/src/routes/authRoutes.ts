import { Router } from 'express';
import { register, login, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOTP);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
