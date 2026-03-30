const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function verifyStorage() {
    console.log('--- Verifying Task Storage ---');
    try {
        // 1. Get initial count
        const initial = await pool.query('SELECT COUNT(*) FROM tasks');
        const initialCount = parseInt(initial.rows[0].count);
        console.log(`Initial tasks: ${initialCount}`);

        // 2. Insert test task
        console.log('Inserting test task...');
        await pool.query(
            `INSERT INTO tasks (user_id, title, description, location, start_time) 
             VALUES ($1, $2, $3, $4, $5)`,
            [9, 'Verification Task', 'Testing if tasks are stored correctly', 'Remote', new Date()]
        );

        // 3. Get new count
        const after = await pool.query('SELECT COUNT(*) FROM tasks');
        const afterCount = parseInt(after.rows[0].count);
        console.log(`Tasks after insertion: ${afterCount}`);

        if (afterCount === initialCount + 1) {
            console.log('✅ SUCCESS: Task was correctly stored in the database.');
        } else {
            console.error('❌ FAILURE: Task count did not increase as expected.');
        }

        // Cleanup
        await pool.query("DELETE FROM tasks WHERE title = 'Verification Task'");
        console.log('Cleaned up test task.');

    } catch (err) {
        console.error('❌ Error during verification:', err.message);
    } finally {
        await pool.end();
    }
}

verifyStorage();
