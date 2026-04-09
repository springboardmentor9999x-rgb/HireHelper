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
                    is_read    BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            
            // Ensure is_read column exists if table was already created
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_read') THEN
                        ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
                    END IF;
                END $$;
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
            `SELECT m.*, u.name as sender_name, u.picture_url as sender_picture
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.request_id = $1
             ORDER BY m.created_at ASC`,
            [requestId]
        );
        return result.rows;
    },

    markAsRead: async (requestId, userId) => {
        const result = await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE request_id = $1 AND sender_id != $2 AND is_read = FALSE
             RETURNING *`,
            [requestId, userId]
        );
        return result.rows;
    },

    getUnreadCount: async (requestId, userId) => {
        const result = await pool.query(
            `SELECT COUNT(*) as count 
             FROM messages 
             WHERE request_id = $1 AND sender_id != $2 AND is_read = FALSE`,
            [requestId, userId]
        );
        return parseInt(result.rows[0].count);
    }
};

module.exports = { Message, initMessageTable };
