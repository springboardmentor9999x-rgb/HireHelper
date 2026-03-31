const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

exports.getNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const notificationsResult = await pool.query(
      'SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    res.json(notificationsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const notifCheck = await pool.query('SELECT user_id FROM notification WHERE id = $1', [id]);
    if (notifCheck.rows.length === 0) return res.status(404).json({ msg: 'Notification not found' });
    if (notifCheck.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    await pool.query('UPDATE notification SET read = true WHERE id = $1', [id]);

    res.json({ msg: 'Marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markAllAsRead = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query('UPDATE notification SET read = true WHERE user_id = $1', [user_id]);
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
