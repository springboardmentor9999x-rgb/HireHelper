const pool = require("../config/db");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await pool.query(
      `SELECT id,
              COALESCE(message, body, '') AS message,
              is_read,
              created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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
