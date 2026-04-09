const pool = require('../config/db');

const initTable = async () => {
    console.log('--- Initializing tasks table ---');
    try {
        const client = await pool.connect();
        console.log('✅ taskModel connected to pool');
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title      VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    location   VARCHAR(255) NOT NULL,
                    start_time TIMESTAMPTZ NOT NULL,
                    end_time   TIMESTAMPTZ,
                    picture_url TEXT,
                    pay        NUMERIC,
                    status     VARCHAR(50) DEFAULT 'OPEN',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ tasks table ready (CREATE TABLE IF NOT EXISTS)');
        } finally {
            client.release();
            console.log('✅ taskModel released connection');
        }
    } catch (err) {
        console.error('⚠️ Critical error in taskModel initTable:', err.message);
        throw err; // Propagate error
    }
};

const Task = {
    create: async (taskData) => {
        const { user_id, title, description, location, start_time, end_time, picture_url, pay } = taskData;
        const result = await pool.query(
            `INSERT INTO tasks (user_id, title, description, location, start_time, end_time, picture_url, pay)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [user_id, title, description, location, start_time, end_time, picture_url, pay]
        );
        return result.rows[0];
    },

    findByUserId: async (userId) => {
        const result = await pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    },

    getFeed: async (excludeUserId) => {
        const result = await pool.query(
            `SELECT t.*, 
                    u.name as owner_name,
                    u.picture_url as owner_picture,
                    EXISTS (SELECT 1 FROM requests r WHERE r.task_id = t.id AND r.user_id = $1) as has_requested
             FROM tasks t
             JOIN users u ON t.user_id = u.id
             WHERE t.user_id != $1 AND UPPER(TRIM(t.status)) = 'OPEN'
             ORDER BY t.created_at DESC`,
            [excludeUserId]
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        return result.rows[0];
    },

    update: async (id, taskData) => {
        const { title, description, location, start_time, end_time, picture_url, pay, status } = taskData;
        const result = await pool.query(
            `UPDATE tasks 
             SET title = $1, description = $2, location = $3, start_time = $4, end_time = $5, picture_url = $6, pay = $7, status = $8
             WHERE id = $9
             RETURNING *`,
            [title, description, location, start_time, end_time, picture_url, pay, status, id]
        );
        return result.rows[0];
    },

    updateStatus: async (id, status) => {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        return true;
    }
};

module.exports = { Task, initTable };
