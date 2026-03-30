const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkConnections() {
    console.log('--- Checking Database Connections ---');
    try {
        const res = await pool.query(`
            SELECT pid, state, query, wait_event_type, wait_event 
            FROM pg_stat_activity 
            WHERE datname = 'hirehelper';
        `);
        console.log(`Active connections: ${res.rows.length}`);
        res.rows.forEach(row => {
            console.log(`[PID: ${row.pid}] State: ${row.state}, Wait: ${row.wait_event_type}:${row.wait_event}`);
            console.log(`Query: ${row.query.substring(0, 100)}...`);
            console.log('---');
        });

    } catch (err) {
        console.error('❌ Connection check failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkConnections();
