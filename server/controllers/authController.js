const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    try {
        // Fetch user from DB
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

exports.updateProfile = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    try {
        await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
        return res.json({ success: true, message: 'Profile updated successfully', name });
    } catch (err) {
        console.error('Update profile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while updating profile' });
    }
};
