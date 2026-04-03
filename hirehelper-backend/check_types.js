const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkColumnTypes() {
    try {
        const res = await pool.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('users', 'reviews', 'tasks')
            AND column_name IN ('id', 'user_id', 'assignee_id', 'task_id', 'reviewer_id', 'reviewee_id');
        `);
        console.log('Column Types:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error checking column types:', err);
    } finally {
        await pool.end();
    }
}

checkColumnTypes();
