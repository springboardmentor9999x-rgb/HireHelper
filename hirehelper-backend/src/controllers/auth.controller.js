const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const OTP_EXPIRY_MINUTES = 10;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"HireHelper" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  // 🔥 VALIDATION FIRST
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format ❌"
    });
  }

  try {
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.query(
      `INSERT INTO users (first_name, last_name, email, password, otp, otp_expiry)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [first_name, last_name, email, hashedPassword, otp, otpExpiry]
    );

    exports.sendEmail(
      email,
      'HireHelper - OTP Verification',
      `Your OTP for HireHelper is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`
    );

    return res.status(201).json({
      message: 'User registered. Please verify OTP.'
    });

  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const result = await db.query(
      'SELECT id, otp, otp_expiry, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    await db.query(
      'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE id = $1',
      [user.id]
    );

    return res.status(200).json({ message: 'OTP verified successfully. You can now log in.' });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await db.query(
      'SELECT id, first_name, email, password, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res.status(400).json({ message: 'Please verify your account first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};