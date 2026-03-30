require('dotenv').config();
const pool = require('./config/db');

async function testSeparation() {
    try {
        console.log('--- Testing Task Separation ---');
        
        // 1. Get User 9 and User 8
        const user9 = 9;
        const user8 = 8;
        
        console.log(`Checking tasks for User ${user9}...`);
        const res9 = await pool.query('SELECT id, title, user_id FROM tasks WHERE user_id = $1', [user9]);
        console.log(`User 9 task count: ${res9.rows.length}`);
        
        console.log(`Checking tasks for User ${user8}...`);
        const res8 = await pool.query('SELECT id, title, user_id FROM tasks WHERE user_id = $1', [user8]);
        console.log(`User 8 task count: ${res8.rows.length}`);
        
        console.log(`Checking Feed for User 9 (should exclude User 9)...`);
        const feed9 = await pool.query('SELECT id, title, user_id FROM tasks WHERE user_id != $1', [user9]);
        console.log(`User 9 feed count: ${feed9.rows.length}`);
        
        console.log(`Checking Feed for User 8 (should exclude User 8)...`);
        const feed8 = await pool.query('SELECT id, title, user_id FROM tasks WHERE user_id != $1', [user8]);
        console.log(`User 8 feed count: ${feed8.rows.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testSeparation();
