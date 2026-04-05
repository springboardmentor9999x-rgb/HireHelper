import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { sendVerificationOTP, sendPasswordResetLink } from '../services/emailService';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface RegisterBody {
    first_name: string;
    last_name: string;
    phone_number: string;
    email_id: string;
    password: string;
    role?: string;
}

interface LoginBody {
    email: string;
    password: string;
}

interface VerifyOTPBody {
    email: string;
    otp: string;
}

export const register = async (req: Request<{}, {}, RegisterBody>, res: Response, next: NextFunction) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing or empty' });
    }

    const { first_name, last_name, phone_number, email_id, password, role } = req.body;

    // --- Server-side field validation ---

    // Required fields
    if (!first_name || !last_name || !phone_number || !email_id || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // First / Last name: letters only, 2+ chars
    const nameRegex = /^[a-zA-Z\s'\-]{2,}$/;
    if (!nameRegex.test(first_name.trim())) {
        return res.status(400).json({ message: 'First name must be at least 2 characters and contain only letters.' });
    }
    if (!nameRegex.test(last_name.trim())) {
        return res.status(400).json({ message: 'Last name must be at least 2 characters and contain only letters.' });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_id.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Phone number: 7-15 digits (optional leading +)
    const phoneRegex = /^\+?[\d\s\-]{7,15}$/;
    if (!phoneRegex.test(phone_number.trim())) {
        return res.status(400).json({ message: 'Please provide a valid phone number (7-15 digits).' });
    }

    // Password strength
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one lowercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one number.' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one special character.' });
    }

    // Role whitelist
    const allowedRoles = ['user', 'helper'];
    const assignedRole = role && allowedRoles.includes(role) ? role : 'user';

    // Normalise email to lower-case
    const normalizedEmail = email_id.trim().toLowerCase();

    try {
        // 1. Check if email already exists
        const userExists = await pool.query('SELECT id FROM users WHERE email_id = $1', [normalizedEmail]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'This email is already registered. Please use a different email or sign in.' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 4. Insert user
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, phone_number, email_id, password, role, otp, otp_expiry, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, first_name, last_name, email_id, role',
            [first_name.trim(), last_name.trim(), phone_number.trim(), normalizedEmail, hashedPassword, assignedRole, otp, otpExpiry, false]
        );

        // 5. Send OTP via email
        try {
            await sendVerificationOTP(normalizedEmail, otp);
        } catch (mailError) {
            console.error('Error sending email:', mailError);
        }

        res.status(201).json({
            message: 'User registered successfully. Please verify your email with the OTP sent.',
            user: {
                id: newUser.rows[0].id,
                first_name: newUser.rows[0].first_name,
                last_name: newUser.rows[0].last_name,
                email: newUser.rows[0].email_id,
                role: newUser.rows[0].role,
                phone_number: newUser.rows[0].phone_number,
                bio: newUser.rows[0].bio,
                professional_title: newUser.rows[0].professional_title,
                picture_url: newUser.rows[0].picture_url,
                theme: newUser.rows[0].theme,
                notifications_enabled: newUser.rows[0].notifications_enabled
            }
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req: Request<{}, {}, VerifyOTPBody>, res: Response, next: NextFunction) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing or empty' });
    }

    const { email, otp } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email_id = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        await pool.query(
            'UPDATE users SET is_verified = true WHERE email_id = $1',
            [email]
        );

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => {

    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // 1. Fetch user by email
        const result = await pool.query('SELECT * FROM users WHERE email_id = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Check if verified
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your account' });
        }

        // 3. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email_id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Return token
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email_id,
                role: user.role,
                phone_number: user.phone_number,
                bio: user.bio,
                professional_title: user.professional_title,
                picture_url: user.picture_url,
                theme: user.theme,
                notifications_enabled: user.notifications_enabled
            }
        });
    } catch (error) {
        next(error);
    }
};

export const resendOTP = async (req: Request<{}, {}, { email: string }>, res: Response, next: NextFunction) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email_id = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.is_verified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const updateResult = await pool.query(
            'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email_id = $3',
            [otp, otpExpiry, email]
        );

        await sendVerificationOTP(email, otp);

        res.json({ message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request<{}, {}, { email: string }>, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email_id = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            // To prevent email enumeration, we could return success anyway.
            // But for this app, we'll return an error or a generic success.
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await pool.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email_id = $3',
            [token, expiry, email]
        );

        await sendPasswordResetLink(email, token);

        res.json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request<{}, {}, { token: string; password: string }>, res: Response, next: NextFunction) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Password strength validation (same as register)
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ message: 'Password does not meet strength requirements.' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        next(error);
    }
};
