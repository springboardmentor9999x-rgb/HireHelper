const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkReviews() {
    try {
        const res = await pool.query('SELECT * FROM reviews');
        console.log('Reviews in DB:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('First review full data:', JSON.stringify(res.rows[0], null, 2));
        }
    } catch (err) {
        console.error('Error checking reviews:', err);
    } finally {
        await pool.end();
    }
}

checkReviews();
