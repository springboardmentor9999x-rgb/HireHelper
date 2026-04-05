import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/db';

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone_number, bio, professional_title } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name),
                 phone_number = COALESCE($3, phone_number),
                 bio = COALESCE($4, bio),
                 professional_title = COALESCE($5, professional_title),
                 picture_url = COALESCE($6, picture_url)
             WHERE id = $7 
             RETURNING id, first_name, last_name, phone_number, email_id, bio, professional_title, picture_url`,
            [first_name, last_name, phone_number, bio, professional_title, req.body.picture_url, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { theme, notifications_enabled } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET theme = COALESCE($1, theme), 
                 notifications_enabled = COALESCE($2, notifications_enabled)
             WHERE id = $3 
             RETURNING theme, notifications_enabled`,
            [theme, notifications_enabled, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Settings updated successfully',
            settings: result.rows[0]
        });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        // Note: In a real app, you might want to handle cascades or soft deletes.
        // For now, we'll do a hard delete. Related records (tasks, reviews) should be handled by DB FK cascades if defined.
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = (req.file as any).path;

        await pool.query('UPDATE users SET picture_url = $1 WHERE id = $2', [imageUrl, userId]);

        res.json({
            message: 'Profile picture uploaded successfully',
            picture_url: imageUrl
        });
    } catch (error) {
        console.error('Upload Profile Picture Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
