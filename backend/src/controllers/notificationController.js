const pool = require('../config/db');
const { HTTP_CODES } = require('../config/constants');

/**
 * Notification Controller
 * Handles user notifications
 */

const notificationController = {
  /**
   * GET /api/notifications
   * Get all notifications for logged-in user
   */
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT id, user_id, body, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query, [userId]);

      res.json({
        success: true,
        data: result.rows || [],
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/notifications/read/:notificationId
   * Mark a notification as read
   */
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      // Verify notification belongs to user
      const verifyQuery = `
        SELECT id FROM notifications
        WHERE id = $1 AND user_id = $2
      `;

      const verifyResult = await pool.query(verifyQuery, [notificationId, userId]);

      if (verifyResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'Notification not found',
        });
      }

      // Update notification
      const updateQuery = `
        UPDATE notifications
        SET is_read = true
        WHERE id = $1
        RETURNING id, user_id, body, is_read, created_at
      `;

      const result = await pool.query(updateQuery, [notificationId]);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Get count of unread notifications
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = $1 AND is_read = false
      `;

      const result = await pool.query(query, [userId]);
      const count = parseInt(result.rows[0].count) || 0;

      res.json({
        success: true,
        count: count,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/notifications/create
   * Create a new notification (for admin/system use)
   */
  createNotification: async (req, res) => {
    try {
      const { userId, body } = req.body;

      if (!userId || !body) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'userId and body are required',
        });
      }

      const query = `
        INSERT INTO notifications (user_id, body, is_read, created_at)
        VALUES ($1, $2, false, CURRENT_TIMESTAMP)
        RETURNING id, user_id, body, is_read, created_at
      `;

      const result = await pool.query(query, [userId, body]);

      res.status(HTTP_CODES.CREATED || 201).json({
        success: true,
        message: 'Notification created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read for user
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE user_id = $1 AND is_read = false
        RETURNING id, user_id, body, is_read, created_at
      `;

      const result = await pool.query(query, [userId]);

      res.json({
        success: true,
        message: `Marked ${result.rows.length} notifications as read`,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/notifications/:notificationId
   * Delete a notification
   */
  deleteNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      // Verify notification belongs to user
      const verifyQuery = `
        SELECT id FROM notifications
        WHERE id = $1 AND user_id = $2
      `;

      const verifyResult = await pool.query(verifyQuery, [notificationId, userId]);

      if (verifyResult.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: 'Notification not found',
        });
      }

      // Delete notification
      const deleteQuery = `
        DELETE FROM notifications
        WHERE id = $1
      `;

      await pool.query(deleteQuery, [notificationId]);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  },
};

module.exports = notificationController;
