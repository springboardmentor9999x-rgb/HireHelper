const pool = require("../config/db");

exports.getMe = async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, first_name, last_name, email_id, phone_number, is_verified, profile_picture,
              profession, interests, experience_years, skills, bio, city, availability
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

exports.updateMe = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      profile_picture,
      profession,
      interests,
      experience_years,
      skills,
      bio,
      city,
      availability
    } = req.body;

    if (!first_name || !last_name || !phone_number) {
      return res.status(400).json({ message: "First name, last name, and phone number are required" });
    }

    const updatedUser = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           phone_number = $3,
           profile_picture = COALESCE($4, profile_picture),
           profession = $5,
           interests = $6,
           experience_years = $7,
           skills = $8,
           bio = $9,
           city = $10,
           availability = $11
       WHERE id = $12
       RETURNING id, first_name, last_name, email_id, phone_number, is_verified, profile_picture,
                 profession, interests, experience_years, skills, bio, city, availability`,
      [
        first_name,
        last_name,
        phone_number,
        profile_picture ?? null,
        profession || null,
        interests || null,
        Number.isFinite(Number(experience_years)) ? Number(experience_years) : null,
        skills || null,
        bio || null,
        city || null,
        availability || null,
        req.user.id
      ]
    );

    return res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
