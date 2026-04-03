const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function diagnostic() {
    try {
        const userId = 2; // Testing for user 2 who is the reviewee in our data
        const query = `
            SELECT r.*, u.first_name, u.last_name, t.title as task_title
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            JOIN tasks t ON r.task_id = t.id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC;
        `;
        const res = await pool.query(query, [userId]);
        console.log('Diagnostic query results:', res.rows.length);
        fs.writeFileSync('diagnostic_output.json', JSON.stringify({
            userId,
            resultsCount: res.rows.length,
            rows: res.rows
        }, null, 2));
    } catch (err) {
        console.error('Diagnostic query failed:', err);
        fs.writeFileSync('diagnostic_error.json', JSON.stringify(err, null, 2));
    } finally {
        await pool.end();
    }
}

diagnostic();
