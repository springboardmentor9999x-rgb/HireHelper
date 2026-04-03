const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkReviews() {
    try {
        const res = await pool.query('SELECT * FROM reviews');
        const output = {
            count: res.rows.length,
            rows: res.rows
        };
        fs.writeFileSync('reviews_output.json', JSON.stringify(output, null, 2));
        console.log('Results saved to reviews_output.json');
    } catch (err) {
        console.error('Error checking reviews:', err);
    } finally {
        await pool.end();
    }
}

checkReviews();
