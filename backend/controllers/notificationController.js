const pool = require("../config/db");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await pool.query(
      `SELECT 
        n.id,
        n.task_id,
        COALESCE(n.message, n.body, '') AS message,
        n.is_read,
        n.created_at,
        t.title as task_title
       FROM notifications n
        LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );

    return res.json(notifications.rows);
  } catch (err) {
    console.error("[getNotifications] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("[deleteNotification] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE user_id = $1
       RETURNING id`,
      [userId]
    );

    return res.json({ 
      message: `Deleted ${result.rowCount} notifications`,
      deletedCount: result.rowCount 
    });
  } catch (err) {
    console.error("[deleteAllNotifications] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND COALESCE(is_read, false) = false`,
      [userId]
    );

    return res.json({
      message: "Notifications marked as read",
      updatedCount: result.rowCount
    });
  } catch (err) {
    console.error("[markAllNotificationsAsRead] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
