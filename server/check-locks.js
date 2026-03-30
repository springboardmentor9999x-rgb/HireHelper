const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkLocks() {
    console.log('--- Checking Database Locks ---');
    try {
        const res = await pool.query(`
            SELECT pg_locks.pid, locktype, mode, granted, query 
            FROM pg_locks 
            JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
            WHERE datname = 'hirehelper';
        `);
        console.log(`Found ${res.rows.length} locks.`);
        res.rows.forEach(row => {
            console.log(`[PID: ${row.pid}] LockType: ${row.locktype}, Mode: ${row.mode}, Granted: ${row.granted}`);
            console.log(`Query: ${row.query.substring(0, 50)}...`);
            console.log('---');
        });

    } catch (err) {
        console.error('❌ Lock check failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkLocks();
