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
          bio,
          profile_picture,
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
          profile: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            bio: user.bio,
            profile_picture: user.profile_picture,
            created_at: user.created_at,
          },
          privacy: {
            show_profile_in_feed: user.profile_visibility,
            allow_messages: true, // Default for now
            show_phone_to_requesters: user.profile_visibility,
            email_notifications: user.notification_email,
          },
          language: {
            current: user.language || 'English',
          },
          appearance: {
            dark_mode: user.dark_mode || false,
          },
          notifications: {
            task_requests: user.notification_push || false,
            task_updates: user.notification_push || false,
            announcements: user.notification_email || false,
          },
          security: {
            last_login: user.last_login,
            created_at: user.created_at,
          },
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
   * PUT /api/settings/profile
   * Update user profile information
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name, phone_number, bio, profile_picture } = req.body;

      // Validation
      if (!first_name || first_name.trim().length < 2) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'First name must be at least 2 characters',
        });
      }

      if (!last_name || last_name.trim().length < 2) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Last name must be at least 2 characters',
        });
      }

      if (phone_number && phone_number.replace(/\D/g, '').length < 10) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Phone number must be at least 10 digits',
        });
      }

      const query = `
        UPDATE users 
        SET 
          first_name = $2,
          last_name = $3,
          phone_number = COALESCE($4, phone_number),
          bio = COALESCE($5, bio),
          profile_picture = COALESCE($6, profile_picture)
        WHERE id = $1
        RETURNING 
          id,
          first_name,
          last_name,
          email,
          phone_number,
          bio,
          profile_picture,
          created_at
      `;

      const result = await pool.query(query, [
        userId,
        first_name,
        last_name,
        phone_number || null,
        bio || null,
        profile_picture || null
      ]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = result.rows[0];

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          bio: user.bio,
          profile_picture: user.profile_picture,
          created_at: user.created_at
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update profile',
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
      const {
        task_requests,
        task_updates,
        announcements,
        notification_email,
        notification_push
      } = req.body;

      const query = `
        UPDATE users 
        SET 
          notification_push = COALESCE($2, notification_push),
          notification_email = COALESCE($3, notification_email)
        WHERE id = $1
        RETURNING id, notification_email, notification_push
      `;

      const result = await pool.query(query, [
        userId,
        // Use task_requests/task_updates as notification_push
        task_requests !== undefined ? task_requests : (task_updates !== undefined ? task_updates : null),
        // Use announcements or notification_email
        announcements !== undefined ? announcements : (notification_email !== undefined ? notification_email : null)
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
            task_requests: result.rows[0].notification_push,
            task_updates: result.rows[0].notification_push,
            announcements: result.rows[0].notification_email,
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
   * PUT /api/settings/appearance
   * Update appearance settings (dark mode) - alias for updateTheme
   */
  updateAppearance: async (req, res) => {
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
        message: 'Appearance settings updated successfully',
        data: {
          appearance: {
            dark_mode: result.rows[0].dark_mode,
          },
        },
      });
    } catch (error) {
      console.error('Error updating appearance:', error);
      res.status(HTTP_CODES.SERVER_ERROR).json({
        success: false,
        message: 'Failed to update appearance settings',
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

      const validLanguages = ['English', 'Telugu', 'Hindi'];
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
      const {
        show_profile_in_feed,
        allow_messages,
        show_phone_to_requesters,
        email_notifications
      } = req.body;

      const query = `
        UPDATE users 
        SET 
          profile_visibility = COALESCE($2, profile_visibility),
          notification_email = COALESCE($3, notification_email)
        WHERE id = $1
        RETURNING id, profile_visibility, notification_email
      `;

      const result = await pool.query(query, [
        userId,
        show_profile_in_feed !== undefined ? show_profile_in_feed : null,
        email_notifications !== undefined ? email_notifications : null
      ]);

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
            show_profile_in_feed: result.rows[0].profile_visibility,
            allow_messages: true,
            show_phone_to_requesters: result.rows[0].profile_visibility,
            email_notifications: result.rows[0].notification_email,
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
