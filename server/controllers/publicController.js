const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const tasksCount = await pool.query('SELECT COUNT(*) FROM tasks');
        const completedCount = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED'");
        // If 'COMPLETED' status doesn't exist yet, we can count accepted requests or total requests
        const totalRequests = await pool.query('SELECT COUNT(*) FROM requests');

        return res.json({
            success: true,
            stats: {
                users: parseInt(usersCount.rows[0].count),
                tasks: parseInt(tasksCount.rows[0].count),
                completed: parseInt(completedCount.rows[0].count) || parseInt(totalRequests.rows[0].count),
                teamMembers: 12 // Placeholder for team members if not in DB
            }
        });
    } catch (err) {
        console.error('Public stats error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics.'
        });
    }
};
