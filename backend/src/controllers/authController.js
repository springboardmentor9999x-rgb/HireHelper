const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { HTTP_CODES, MESSAGES } = require('../config/constants');
const { generateOTP, getOTPExpiry } = require('../utils/otpGenerator');
const { sendOTPEmail } = require('../services/emailService');

/**
 * Authentication controller
 */

const saltRounds = 10;

const authController = {
  register: async (req, res) => {
    try {
      const { first_name, last_name, email, password, phone_number } = req.body;

      // basic validation
      if (!first_name || !last_name || !email || !password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Required fields missing',
        });
      }

      // check existing user
      const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (rows.length > 0) {
        return res.status(HTTP_CODES.CONFLICT).json({
          success: false,
          message: 'Email already in use',
        });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // generate OTP
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || 5));

      // insert new user with OTP
      const insertQuery = `
        INSERT INTO users (first_name, last_name, phone_number, email, password, otp, otp_expiry)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, first_name, last_name, email, phone_number, is_verified, created_at
      `;
      const insertValues = [
        first_name,
        last_name,
        phone_number || null,
        email,
        hashedPassword,
        otp,
        otpExpiry,
      ];

      const result = await pool.query(insertQuery, insertValues);
      const newUser = result.rows[0];

      // send OTP email
      try {
        await sendOTPEmail(email, otp, first_name);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Continue even if email fails - user can request resend
      }

      res.status(HTTP_CODES.CREATED).json({
        success: true,
        message: 'User registered successfully. OTP sent to email. Please verify your email.',
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          message: 'Check your email for OTP verification',
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      // validation
      if (!email || !otp) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email and OTP are required',
        });
      }

      // get user and check OTP
      const userResult = await pool.query(
        'SELECT id, otp, otp_expiry, is_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      const user = userResult.rows[0];

      // check if already verified
      if (user.is_verified) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email already verified',
        });
      }

      // check if OTP is correct
      if (user.otp !== otp) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid OTP',
        });
      }

      // check if OTP has expired
      if (new Date() > new Date(user.otp_expiry)) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'OTP has expired',
        });
      }

      // update user as verified and clear OTP
      await pool.query(
        'UPDATE users SET is_verified = true, otp = NULL, otp_expiry = NULL WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '7d' }
      );

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          token: token,
          user: {
            id: user.id,
            email: email
          }
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Resend OTP
   */
  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email is required',
        });
      }

      // get user
      const userResult = await pool.query(
        'SELECT id, first_name, is_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      const user = userResult.rows[0];

      // check if already verified
      if (user.is_verified) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email already verified',
        });
      }

      // generate new OTP
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || 5));

      // update OTP in database
      await pool.query(
        'UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3',
        [otp, otpExpiry, user.id]
      );

      // send OTP email
      try {
        await sendOTPEmail(email, otp, user.first_name);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Continue even if email fails
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'OTP resent successfully. Check your email.',
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // validation
      if (!email || !password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // check if user exists
      const userResult = await pool.query(
        'SELECT id, email, password, first_name, last_name, is_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.INVALID_CREDENTIALS,
        });
      }

      const user = userResult.rows[0];

      // check verification status
      if (!user.is_verified) {
        return res.status(HTTP_CODES.FORBIDDEN).json({
          success: false,
          message: 'Please verify your account first.',
        });
      }

      // compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.INVALID_CREDENTIALS,
        });
      }

      // generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '1d' }
      );

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Forgot Password - Generate OTP
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Check if user exists
      const userResult = await pool.query(
        'SELECT id, first_name FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found with this email',
        });
      }

      const user = userResult.rows[0];

      // Generate OTP for password reset
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || 5));

      // Update user with OTP
      await pool.query(
        'UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3',
        [otp, otpExpiry, user.id]
      );

      // Send OTP email
      try {
        await sendOTPEmail(email, otp, user.first_name, 'Password Reset');
      } catch (emailError) {
        console.error('Failed to send password reset OTP email:', emailError);
        // Continue even if email fails - user can request resend
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'OTP sent to your email. Please verify to reset your password.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Verify OTP for Password Reset
   */
  verifyPasswordResetOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email and OTP are required',
        });
      }

      // Get user and check OTP
      const userResult = await pool.query(
        'SELECT id, otp, otp_expiry FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      const user = userResult.rows[0];

      // Check if OTP is correct
      if (user.otp !== otp) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid OTP',
        });
      }

      // Check if OTP has expired
      if (new Date() > new Date(user.otp_expiry)) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'OTP has expired',
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
      });
    } catch (error) {
      console.error('Password reset OTP verification error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Reset Password
   */
  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Email and new password are required',
        });
      }

      if (newPassword.length < 6) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }

      // Get user
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      const user = userResult.rows[0];

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear OTP
      await pool.query(
        'UPDATE users SET password = $1, otp = NULL, otp_expiry = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },
};

module.exports = authController;