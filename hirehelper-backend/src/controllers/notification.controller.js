const db = require('../config/db');


exports.getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
          n.id,
          n.user_id,
          n.sender_id,
          n.type,
          n.message,
          n.task_id,
          n.is_read,
          n.created_at,
          u.first_name AS sender_name
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get Notifications Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (err) {
    console.error('Mark Read Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.createChatNotification = async (req, res) => {
  try {
    const { receiver_id, sender_id, message, task_id } = req.body;

    await db.query(
      `INSERT INTO notifications (user_id, sender_id, type, message, task_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiver_id,
        sender_id,
        'chat',    
        message,
        task_id
      ]
    );

    res.json({ message: 'Chat notification created' });

  } catch (err) {
    console.error('Create Chat Notification Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};