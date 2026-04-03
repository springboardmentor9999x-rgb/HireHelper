const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTasks() {
    try {
        const res = await pool.query('SELECT * FROM tasks WHERE id = 1');
        const output = {
            count: res.rows.length,
            rows: res.rows
        };
        fs.writeFileSync('tasks_output.json', JSON.stringify(output, null, 2));
        console.log('Results saved to tasks_output.json');
    } catch (err) {
        console.error('Error checking tasks:', err);
    } finally {
        await pool.end();
    }
}

checkTasks();
