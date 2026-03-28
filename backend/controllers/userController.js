const pool = require("../config/db");

exports.getMe = async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, first_name, last_name, email_id, phone_number, is_verified, profile_picture
       FROM users
       WHERE id=$1`,
      [req.user.id]
    );

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
};
