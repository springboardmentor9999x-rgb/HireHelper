const pool = require('../config/db');

const initRequestTable = async () => {
    console.log('--- Initializing requests table ---');
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS requests (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                    message    TEXT,
                    status     VARCHAR(50) DEFAULT 'PENDING',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ requests table ready');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('⚠️ Critical error in requestModel initRequestTable:', err.message);
        throw err;
    }
};

const Request = {
    create: async (requestData) => {
        const { user_id, task_id, message } = requestData;
        const result = await pool.query(
            `INSERT INTO requests (user_id, task_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, task_id, message]
        );
        return result.rows[0];
    },

    findById: async (id) => {
        const result = await pool.query(
            `SELECT r.*, t.user_id as owner_id, t.title as task_title
             FROM requests r
             JOIN tasks t ON r.task_id = t.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
    },

    findByUserId: async (userId) => {
        const result = await pool.query(
            `SELECT r.*, t.title as task_title, t.user_id as owner_id, u.name as owner_name,
               (SELECT COUNT(*) FROM messages m WHERE m.request_id = r.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
             FROM requests r
             JOIN tasks t ON r.task_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    findByTaskId: async (taskId) => {
        const result = await pool.query(
            `SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM requests r
             JOIN users u ON r.user_id = u.id
             WHERE r.task_id = $1
             ORDER BY r.created_at DESC`,
            [taskId]
        );
        return result.rows;
    },

    findExistingRequest: async (userId, taskId) => {
        const result = await pool.query(
            `SELECT * FROM requests WHERE user_id = $1 AND task_id = $2`,
            [userId, taskId]
        );
        return result.rows[0];
    },

    updateStatus: async (id, status) => {
        const result = await pool.query(
            'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    },

    findByTaskOwnerId: async (ownerId) => {
        const result = await pool.query(
            `SELECT r.*, t.title as task_title, u.name as user_name, u.email as user_email, u.phone as user_phone,
               (SELECT COUNT(*) FROM messages m WHERE m.request_id = r.id AND m.sender_id != $1 AND m.is_read = FALSE) as unread_count
             FROM requests r
             JOIN tasks t ON r.task_id = t.id
             JOIN users u ON r.user_id = u.id
             WHERE t.user_id = $1
             ORDER BY r.created_at DESC`,
            [ownerId]
        );
        return result.rows;
    }
};

module.exports = { Request, initRequestTable };
