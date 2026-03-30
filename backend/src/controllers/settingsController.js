/**
 * Settings Controller
 * Handles user settings, preferences, and account management
 */

const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { HTTP_CODES, MESSAGES } = require('../config/constants');

const saltRounds = 10;

const settingsController = {
  /**
   * GET /api/settings
   * Retrieve current user settings
   */
  getSettings: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone_number,
          notification_email,
          notification_push,
          dark_mode,
          language,
          profile_visibility,
          last_login,
          created_at
        FROM users 
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = result.rows[0];

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phoneNumber: user.phone_number,
          notifications: {
            email: user.notification_email,
            push: user.notification_push,
          },
          theme: {
            darkMode: user.dark_mode,
          },
          language: user.language,
          privacy: {
            profileVisibility: user.profile_visibility,
          },
          lastLogin: user.last_login,
          memberSince: user.created_at,
        },
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve settings',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/settings/notifications
   * Update notification preferences
   */
  updateNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notification_email, notification_push } = req.body;

      const query = `
        UPDATE users 
        SET 
          notification_email = COALESCE($2, notification_email),
          notification_push = COALESCE($3, notification_push)
        WHERE id = $1
        RETURNING id, notification_email, notification_push
      `;

      const result = await pool.query(query, [
        userId,
        notification_email !== undefined ? notification_email : null,
        notification_push !== undefined ? notification_push : null,
      ]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: {
          notifications: {
            email: result.rows[0].notification_email,
            push: result.rows[0].notification_push,
          },
        },
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update notification settings',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/settings/theme
   * Toggle dark mode preference
   */
  updateTheme: async (req, res) => {
    try {
      const userId = req.user.id;
      const { dark_mode } = req.body;

      if (dark_mode === undefined) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'dark_mode field is required',
        });
      }

      const query = `
        UPDATE users 
        SET dark_mode = $2
        WHERE id = $1
        RETURNING id, dark_mode
      `;

      const result = await pool.query(query, [userId, dark_mode]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Theme settings updated successfully',
        data: {
          theme: {
            darkMode: result.rows[0].dark_mode,
          },
        },
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update theme settings',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/settings/language
   * Update language preference
   */
  updateLanguage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { language } = req.body;

      if (!language) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'language field is required',
        });
      }

      const validLanguages = ['English', 'Spanish', 'Hindi'];
      if (!validLanguages.includes(language)) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: `Language must be one of: ${validLanguages.join(', ')}`,
        });
      }

      const query = `
        UPDATE users 
        SET language = $2
        WHERE id = $1
        RETURNING id, language
      `;

      const result = await pool.query(query, [userId, language]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Language preference updated successfully',
        data: {
          language: result.rows[0].language,
        },
      });
    } catch (error) {
      console.error('Error updating language:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update language preference',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/settings/privacy
   * Update privacy settings
   */
  updatePrivacy: async (req, res) => {
    try {
      const userId = req.user.id;
      const { profile_visibility } = req.body;

      if (profile_visibility === undefined) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'profile_visibility field is required',
        });
      }

      const query = `
        UPDATE users 
        SET profile_visibility = $2
        WHERE id = $1
        RETURNING id, profile_visibility
      `;

      const result = await pool.query(query, [userId, profile_visibility]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: {
          privacy: {
            profileVisibility: result.rows[0].profile_visibility,
          },
        },
      });
    } catch (error) {
      console.error('Error updating privacy:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update privacy settings',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/settings/change-password
   * Change user password
   */
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // Validation
      if (!current_password || !new_password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'current_password and new_password are required',
        });
      }

      if (new_password.length < 6) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      // Get user from database
      const userQuery = 'SELECT id, password FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = userResult.rows[0];

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password
      const updateQuery = 'UPDATE users SET password = $2 WHERE id = $1 RETURNING id';
      await pool.query(updateQuery, [userId, hashedPassword]);

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to change password',
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/settings/delete-account
   * Permanently delete user account
   */
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'password is required for account deletion',
        });
      }

      // Get user from database
      const userQuery = 'SELECT id, password FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = userResult.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Password is incorrect',
        });
      }

      // Delete user's tasks
      await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);

      // Delete user's task requests
      await pool.query('DELETE FROM task_requests WHERE user_id = $1 OR created_by = $1', [userId]);

      // Delete user account
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message,
      });
    }
  },
};

module.exports = settingsController;
