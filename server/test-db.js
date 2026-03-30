const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function test() {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', res.rows[0]);

        const tasks = await pool.query('SELECT COUNT(*) FROM tasks');
        console.log('✅ Tasks count:', tasks.rows[0].count);

        const users = await pool.query('SELECT COUNT(*) FROM users');
        console.log('✅ Users count:', users.rows[0].count);

    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

test();
