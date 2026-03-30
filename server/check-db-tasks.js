const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTasks() {
    console.log('--- Checking Database Tasks ---');
    try {
        const res = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5');
        console.log(`Found ${res.rows.length} tasks.`);
        res.rows.forEach(task => {
            console.log(`- [ID: ${task.id}] User: ${task.user_id}, Title: ${task.title}, Created: ${task.created_at}`);
        });

        if (res.rows.length === 0) {
            console.log('No tasks found in the database.');
        }

    } catch (err) {
        console.error('❌ DB Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkTasks();
