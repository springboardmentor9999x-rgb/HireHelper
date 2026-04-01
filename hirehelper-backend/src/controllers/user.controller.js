const db = require('../config/db');

exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, email, 
              mobile, address, present_address, 
              experience, skills, description, 
              profile_image, is_profile_complete
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

   
    if (user.profile_image) {
      user.profile_image = `/uploads/${user.profile_image}`;
    }

    return res.status(200).json(user);

  } catch (err) {
    console.error('Get me error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const {
      mobile,
      address,
      present_address,
      experience,
      skills,
      description
    } = req.body;

    let profile_image = null;

    if (req.file) {
      profile_image = req.file.filename;
    }

    await db.query(
      `UPDATE users SET 
        mobile = COALESCE($1, mobile),
        address = COALESCE($2, address),
        present_address = COALESCE($3, present_address),
        experience = COALESCE($4, experience),
        skills = COALESCE($5, skills),
        description = COALESCE($6, description),
        profile_image = COALESCE($7, profile_image),
        is_profile_complete = true
       WHERE id = $8`,
      [
        mobile,
        address,
        present_address,
        experience,
        skills,
        description,
        profile_image,
        req.user.id
      ]
    );

    return res.status(200).json({ message: 'Profile updated successfully' });

  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, first_name, email, skills, experience, description, profile_image
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    if (user.profile_image) {
      user.profile_image = `/uploads/${user.profile_image}`;
    }

    res.status(200).json(user);

  } catch (err) {
    console.error('Get user by id error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};