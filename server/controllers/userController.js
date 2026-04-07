const pool = require('../config/db');

exports.getUserProfile = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;

    if (!id) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // 1. Fetch user public data
        const userResult = await pool.query(
            'SELECT id, name, bio, picture_url, rating_avg, rating_count, created_at FROM users WHERE id = $1',
            [id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userResult.rows[0];

        // 2. Check if requester is authorized to see contact info
        // Authorization: Requester is owner of a task where target user is the ACCEPTED helper
        // OR target user is owner of a task where requester is the ACCEPTED helper
        const authCheck = await pool.query(
            `SELECT 1 FROM requests r
             JOIN tasks t ON r.task_id = t.id
             WHERE r.status = 'ACCEPTED'
             AND (
                 (t.user_id = $1 AND r.user_id = $2) -- Requester is owner, target is helper
                 OR
                 (t.user_id = $2 AND r.user_id = $1) -- Target is owner, requester is helper
             )
             LIMIT 1`,
            [requesterId, id]
        );

        const isAuthorized = authCheck.rows.length > 0 || requesterId === parseInt(id);

        if (isAuthorized) {
            // Fetch contact info
            const contactResult = await pool.query(
                'SELECT email, phone FROM users WHERE id = $1',
                [id]
            );
            if (contactResult.rows.length > 0) {
                user.email = contactResult.rows[0].email;
                user.phone = contactResult.rows[0].phone;
            }
        }

        return res.json({ success: true, profile: user });
    } catch (err) {
        console.error('Get user profile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching user profile' });
    }
};
