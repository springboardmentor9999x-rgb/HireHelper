const pool = require('../config/db');

const initNotificationTable = async () => {
    console.log('--- Initializing notifications table ---');
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    type VARCHAR(50),
                    reference_id INTEGER,
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ notifications table ready');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('⚠️ Critical error in notificationModel initNotificationTable:', err.message);
        throw err;
    }
};

const Notification = {
    create: async (user_id, message, type, reference_id) => {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, message, type, reference_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [user_id, message, type || null, reference_id || null]
        );
        return result.rows[0];
    },

    findByUserId: async (userId) => {
        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    markAsRead: async (id) => {
        const result = await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    },

    markAllAsRead: async (userId) => {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [userId]
        );
        return true;
    }
};

module.exports = { Notification, initNotificationTable };
