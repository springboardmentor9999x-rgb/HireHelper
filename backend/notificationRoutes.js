const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

/* GET NOTIFICATIONS */
router.get('/', verifyToken, async (req, res) => {
  try {

    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

/* MARK AS READ */
router.put('/mark-read', verifyToken, async (req, res) => {
  try {

    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [userId]
    );

    res.json({ message: "Marked as read" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;