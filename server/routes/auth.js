const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = require('../config/db');

// No need for explicit manual connect() if using pool.query directly, 
// but we keep the migration logic below.
const initAuthSchema = async () => {
    const client = await pool.connect();
    console.log('✅ Database connected for auth migrations');
    try {
        await client.query(`
            ALTER TABLE users
              ADD COLUMN IF NOT EXISTS phone          VARCHAR(30),
              ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
              ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
              ADD COLUMN IF NOT EXISTS bio            TEXT,
              ADD COLUMN IF NOT EXISTS picture_url    TEXT,
              ADD COLUMN IF NOT EXISTS rating_avg     NUMERIC DEFAULT 0,
              ADD COLUMN IF NOT EXISTS rating_count   INTEGER DEFAULT 0
        `);
        console.log('✅ users table schema up to date');

        // Ratings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                id         SERIAL PRIMARY KEY,
                task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                rater_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ratee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                score      INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
                comment    TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ ratings table ready');

        // Password reset tokens table
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(128) NOT NULL,
                expires_at TIMESTAMPTZ  NOT NULL,
                used       BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            )
        `);
        console.log('✅ password_reset_tokens table ready');
    } catch (migErr) { console.error('⚠️  Migration warning:', migErr.message); }
    client.release();
};

// initAuthSchema(); // Called manually in server.js now

// ─── In-memory OTP store ──────────────────────────────────────────────────────
// key: "email:<address>" or "phone:<number>"  →  { otp, expiresAt }
const otpStore = new Map();
const OTP_TTL = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,   // Gmail App Password
    },
});

async function sendEmailOtp(toEmail, otp) {
    await transporter.sendMail({
        from: `"HireHelper" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Your HireHelper verification code',
        html: `
          <div style="font-family:sans-serif;max-width:440px;margin:auto;padding:32px;
                      border-radius:12px;background:#0f172a;color:#f1f5f9;">
            <h2 style="margin:0 0 8px;color:#6366f1;">HireHelper</h2>
            <p style="margin:0 0 24px;color:#94a3b8;">Your email verification code is:</p>
            <div style="font-size:42px;font-weight:700;letter-spacing:10px;
                        color:#a5b4fc;margin-bottom:24px;">${otp}</div>
            <p style="margin:0;color:#64748b;font-size:13px;">
              This code expires in <strong>5 minutes</strong>.<br>
              If you didn't request this, you can safely ignore it.
            </p>
          </div>`,
    });
}

// ─── POST /api/auth/send-email-otp ───────────────────────────────────────────
router.post('/send-email-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const otp = generateOtp();
    otpStore.set(`email:${email.toLowerCase().trim()}`, { otp, expiresAt: Date.now() + OTP_TTL });

    try {
        await sendEmailOtp(email.trim(), otp);
        console.log(`📧  Email OTP for ${email}: ${otp}`); // also log for dev convenience
        return res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('Email OTP send error:', err.message);
        return res.status(500).json({ message: 'Failed to send email OTP. Check SMTP settings.' });
    }
});

// ─── POST /api/auth/verify-email-otp ─────────────────────────────────────────
router.post('/verify-email-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const key = `email:${email.toLowerCase().trim()}`;
    const record = otpStore.get(key);

    if (!record || Date.now() > record.expiresAt) {
        otpStore.delete(key);
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(key);
    return res.json({ message: 'Email verified successfully.' });
});

// ─── POST /api/auth/send-phone-otp ───────────────────────────────────────────
router.post('/send-phone-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const otp = generateOtp();
    otpStore.set(`phone:${phone.trim()}`, { otp, expiresAt: Date.now() + OTP_TTL });

    // ── For now: log to console (replace with Twilio / Fast2SMS for real SMS) ──
    console.log(`📱  Phone OTP for ${phone}: ${otp}`);

    return res.json({ message: 'OTP sent to your phone.' });
});

// ─── POST /api/auth/verify-phone-otp ─────────────────────────────────────────
router.post('/verify-phone-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required.' });

    const key = `phone:${phone.trim()}`;
    const record = otpStore.get(key);

    if (!record || Date.now() > record.expiresAt) {
        otpStore.delete(key);
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    otpStore.delete(key);
    return res.json({ message: 'Phone verified successfully.' });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        const userResult = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal whether the email exists
            return res.json({ message: 'If this email is registered, you will receive a reset code.' });
        }

        const user = userResult.rows[0];

        // Invalidate any existing unused tokens for this user
        await pool.query(
            'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
            [user.id]
        );

        // Generate 6-digit OTP and store hash in DB
        const otp = generateOtp();
        const tokenHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, tokenHash, expiresAt]
        );

        // Send email with reset OTP
        await transporter.sendMail({
            from: `"HireHelper" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Reset your HireHelper password',
            html: `
              <div style="font-family:sans-serif;max-width:440px;margin:auto;padding:32px;
                          border-radius:12px;background:#0f172a;color:#f1f5f9;">
                <h2 style="margin:0 0 8px;color:#6366f1;">HireHelper</h2>
                <p style="margin:0 0 24px;color:#94a3b8;">Your password reset code is:</p>
                <div style="font-size:42px;font-weight:700;letter-spacing:10px;
                            color:#a5b4fc;margin-bottom:24px;">${otp}</div>
                <p style="margin:0;color:#64748b;font-size:13px;">
                  This code expires in <strong>10 minutes</strong>.<br>
                  If you didn't request this, you can safely ignore it.
                </p>
              </div>`,
        });

        console.log(`🔑  Password reset OTP for ${email}: ${otp}`);
        return res.json({ message: 'If this email is registered, you will receive a reset code.' });
    } catch (err) {
        console.error('Forgot password error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });

    if (newPassword.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    try {
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (userResult.rows.length === 0)
            return res.status(400).json({ message: 'Invalid email or OTP.' });

        const userId = userResult.rows[0].id;

        // Get the latest unused, non-expired token for this user
        const tokenResult = await pool.query(
            `SELECT id, token_hash, expires_at FROM password_reset_tokens
             WHERE user_id = $1 AND used = false AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        if (tokenResult.rows.length === 0)
            return res.status(400).json({ message: 'OTP has expired or is invalid. Please request a new one.' });

        const tokenRow = tokenResult.rows[0];
        const isMatch = await bcrypt.compare(otp.trim(), tokenRow.token_hash);

        if (!isMatch)
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

        // Mark token as used
        await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenRow.id]);

        // Update user password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        return res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (result.rows.length === 0)
            return res.status(401).json({ message: 'Invalid email or password.' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password.' });

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || '1h' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                picture_url: user.picture_url,
                rating_avg: user.rating_avg,
                rating_count: user.rating_count
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    // phone is now REQUIRED
    if (!name || !email || !password || !phone)
        return res.status(400).json({ message: 'Name, email, phone, and password are required.' });

    // Robust Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Length constraints
    if (name.length > 50) return res.status(400).json({ message: 'Name must be less than 50 characters.' });
    if (password.length < 6 || password.length > 100) return res.status(400).json({ message: 'Password must be between 6 and 100 characters.' });

    if (!/^\+?[\d\s\-().]{7,20}$/.test(phone))
        return res.status(400).json({ message: 'Invalid phone number format.' });

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, phone, email_verified, phone_verified)
             VALUES ($1, $2, $3, $4, true, true)
             RETURNING id, name, email, phone`,
            [name.trim(), email.toLowerCase().trim(), hashed, phone.trim()]
        );
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || '1h' }
        );

        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                bio: null,
                picture_url: null,
                rating_avg: 0,
                rating_count: 0
            },
        });
    } catch (err) {
        console.error('Register error | code:', err.code, '| detail:', err.detail);
        if (err.code === '23505') {
            const detail = err.detail || '';
            if (detail.includes('phone'))
                return res.status(409).json({ message: 'Phone number already in use.' });
            return res.status(409).json({ message: 'Email already in use.' });
        }
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ─── GET /api/auth/me (protected) ─────────────────────────────────────────────
const authMiddleware = require('./middleware/authmiddleware');
const authController = require('../controllers/authController');

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, phone, bio, picture_url, rating_avg, rating_count, email_verified, phone_verified FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'User not found.' });

        return res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Me endpoint error:', err.message);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── PUT /api/auth/change-password (protected) ────────────────────────────────
router.put('/change-password', authMiddleware, authController.changePassword);

// ─── PUT /api/auth/update-profile (protected) ──────────────────────────────────
router.put('/update-profile', authMiddleware, authController.updateProfile);

// ─── POST /api/auth/upload-avatar (protected) ─────────────────────────────────
router.post('/upload-avatar', authMiddleware, authController.uploadAvatarMiddleware, authController.uploadAvatar);

module.exports = { router, initAuthSchema };
