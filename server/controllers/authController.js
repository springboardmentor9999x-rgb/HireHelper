const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');

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
    const { name, bio } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, bio = $2 WHERE id = $3 RETURNING name, bio, picture_url',
            [name, bio || null, userId]
        );
        const updated = result.rows[0];
        return res.json({ success: true, message: 'Profile updated successfully', name: updated.name, bio: updated.bio, picture_url: updated.picture_url });
    } catch (err) {
        console.error('Update profile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while updating profile' });
    }
};

// ─── Multer configuration (Storage in memory) ─────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

exports.uploadAvatarMiddleware = upload.single('avatar');

exports.uploadAvatar = async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
        const file = req.file;
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `user_${userId}_${Date.now()}${ext}`;
        const filePath = `profile/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('profile')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('❌ Supabase upload error detail:', {
                message: error.message,
                name: error.name,
                status: error.status,
                cause: error.cause
            });
            return res.status(500).json({ success: false, message: `Failed to upload to storage: ${error.message}` });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile')
            .getPublicUrl(filePath);

        // Update database
        await pool.query('UPDATE users SET picture_url = $1 WHERE id = $2', [publicUrl, userId]);

        return res.json({ success: true, message: 'Profile picture updated', picture_url: publicUrl });
    } catch (err) {
        console.error('Upload avatar catch error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while uploading picture' });
    }
};
