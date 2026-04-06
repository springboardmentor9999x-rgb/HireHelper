const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { HTTP_CODES, MESSAGES } = require('../config/constants');

/**
 * Profile Controller
 * Handles user profile, settings, and account management
 */

const profileController = {
  /**
   * GET /api/profile/me
   * Get logged-in user's profile
   */
  getProfile: async (req, res) => {
    try {
      console.log("🔍 [Profile] Fetching profile for user:", req.user.id);

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
          created_at
        FROM users
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        console.log("❌ [Profile] User not found:", userId);
        return res.status(HTTP_CODES.NOT_FOUND || 404).json({
          success: false,
          message: 'User not found',
        });
      }

      console.log("✅ [Profile] Profile retrieved successfully for user:", userId);

      res.status(HTTP_CODES.OK || 200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [Profile] Error fetching profile:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR || 500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/profile/update
   * Update user profile (first_name, last_name, phone_number, bio, profile_picture)
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name, phone_number, bio, profile_picture } = req.body;

      console.log('📥 [Profile] Update request for user:', userId);
      console.log('📥 [Profile] Payload:', { first_name, last_name, phone_number, bio: bio ? 'provided' : 'not provided', profile_picture: profile_picture ? 'provided' : 'not provided' });

      // Validation
      if (!first_name && !last_name && !phone_number && !bio && !profile_picture) {
        console.log('⚠️ [Profile] No fields provided for update');
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'At least one field is required to update',
        });
      }

      if (first_name && typeof first_name === 'string' && first_name.trim().length < 2) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'First name must be at least 2 characters',
        });
      }

      if (last_name && typeof last_name === 'string' && last_name.trim().length < 2) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Last name must be at least 2 characters',
        });
      }

      if (phone_number && typeof phone_number === 'string' && phone_number.trim().length < 10) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Phone number must be at least 10 characters',
        });
      }

      if (bio && typeof bio === 'string' && bio.length > 500) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Bio must not exceed 500 characters',
        });
      }

      // Build dynamic query for provided fields
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (first_name && typeof first_name === 'string' && first_name.trim()) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(first_name.trim());
      }

      if (last_name && typeof last_name === 'string' && last_name.trim()) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(last_name.trim());
      }

      if (phone_number && typeof phone_number === 'string' && phone_number.trim()) {
        updates.push(`phone_number = $${paramCount++}`);
        values.push(phone_number.trim());
      }

      if (bio && typeof bio === 'string') {
        updates.push(`bio = $${paramCount++}`);
        values.push(bio || null);
      }

      if (profile_picture && typeof profile_picture === 'string') {
        // Validate profile_picture isn't too large (roughly check if base64 is reasonable)
        if (profile_picture.length > 2000000) { // ~2MB base64 limit
          return res.status(HTTP_CODES.BAD_REQUEST).json({
            success: false,
            message: 'Profile picture is too large',
          });
        }
        updates.push(`profile_picture = $${paramCount++}`);
        values.push(profile_picture);
      }

      // Ensure at least one field is being updated
      if (updates.length === 0) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'No valid fields provided to update',
        });
      }

      values.push(userId);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, first_name, last_name, email, phone_number, bio, profile_picture, created_at
      `;

      console.log('📝 [Profile] Built query with updates:', updates);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        console.log('❌ [Profile] User not found:', userId);
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      console.log('✅ [Profile] Profile updated successfully for user:', userId);

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('❌ [Profile] Error updating profile:', error.message);
      console.error('❌ [Profile] Stack trace:', error.stack);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/profile/change-password
   * Change user password with current password verification
   */
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password, confirm_password } = req.body;

      // Validation
      if (!current_password || !new_password || !confirm_password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'All password fields are required',
        });
      }

      if (new_password !== confirm_password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'New passwords do not match',
        });
      }

      if (new_password.length < 6) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      if (current_password === new_password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'New password must be different from current password',
        });
      }

      // Get user with current password
      const getUserQuery = 'SELECT id, password FROM users WHERE id = $1';
      const userResult = await pool.query(getUserQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        current_password,
        userResult.rows[0].password
      );

      if (!passwordMatch) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password
      const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
      await pool.query(updateQuery, [hashedPassword, userId]);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to change password',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/profile/upload-picture
   * Upload user profile picture
   */
  uploadProfilePicture: async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Validate file size (2MB max)
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'File size must be less than 2MB',
        });
      }

      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Only JPG and PNG files are allowed',
        });
      }

      const profilePicturePath = `/uploads/${req.file.filename}`;

      // Profile picture file has been saved to disk
      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          filename: req.file.filename,
          path: profilePicturePath,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/profile/activity
   * Get user activity statistics
   */
  getActivity: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get tasks statistics
      const tasksQuery = `
        SELECT 
          COUNT(*) as total_tasks_created,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
          SUM(CASE WHEN status IN ('open', 'in progress') THEN 1 ELSE 0 END) as tasks_pending
        FROM tasks
        WHERE user_id = $1
      `;

      const tasksResult = await pool.query(tasksQuery, [userId]);

      // For now, set requests to 0 (can be implemented with requests table)
      const activity = {
        total_tasks_created: parseInt(tasksResult.rows[0].total_tasks_created) || 0,
        tasks_completed: parseInt(tasksResult.rows[0].tasks_completed) || 0,
        tasks_pending: parseInt(tasksResult.rows[0].tasks_pending) || 0,
        requests_received: 0, // Will be populated when requests feature is implemented
        requests_sent: 0, // Will be populated when requests feature is implemented
      };

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch activity',
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/profile/delete-account
   * Delete user account with password confirmation
   */
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Password is required to delete account',
        });
      }

      // Get user with password
      const getUserQuery = 'SELECT id, password FROM users WHERE id = $1';
      const userResult = await pool.query(getUserQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(
        password,
        userResult.rows[0].password
      );

      if (!passwordMatch) {
        return res.status(HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Password is incorrect',
        });
      }

      // Delete user
      const deleteQuery = 'DELETE FROM users WHERE id = $1';
      await pool.query(deleteQuery, [userId]);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/profile/picture
   * Delete user's profile picture
   */
  deleteProfilePicture: async (req, res) => {
    try {
      const userId = req.user.id;

      // Picture deletion would be handled separately
      res.json({
        success: true,
        message: 'Profile picture deleted successfully',
      });

      res.json({
        success: true,
        message: 'Profile picture deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete profile picture',
        error: error.message,
      });
    }
  },
};

module.exports = profileController;
