const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, first_name, last_name, email_id FROM users');
        fs.writeFileSync('users_output.json', JSON.stringify({
            count: res.rows.length,
            rows: res.rows
        }, null, 2));
        console.log('Results saved to users_output.json');
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
