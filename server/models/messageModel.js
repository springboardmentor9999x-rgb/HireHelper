const pool = require('../config/db');

const initMessageTable = async () => {
    console.log('--- Initializing messages table ---');
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id         SERIAL PRIMARY KEY,
                    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
                    sender_id  INTEGER NOT NULL REFERENCES users(id),
                    content    TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ messages table ready');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('⚠️ Critical error in messageModel initMessageTable:', err.message);
        throw err;
    }
};

const Message = {
    create: async (messageData) => {
        const { request_id, sender_id, content } = messageData;
        const result = await pool.query(
            `INSERT INTO messages (request_id, sender_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [request_id, sender_id, content]
        );
        return result.rows[0];
    },

    findByRequestId: async (requestId) => {
        const result = await pool.query(
            `SELECT m.*, u.name as sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.request_id = $1
             ORDER BY m.created_at ASC`,
            [requestId]
        );
        return result.rows;
    }
};

module.exports = { Message, initMessageTable };
