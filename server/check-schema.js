const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
    console.log('--- Checking Database Schema ---');
    try {
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('Tables found:', tables.rows.map(t => t.table_name).join(', '));

        if (tables.rows.some(t => t.table_name === 'users')) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users';
            `);
            console.log('Users table columns:');
            columns.rows.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
        } else {
            console.log('❌ Users table does NOT exist!');
        }

    } catch (err) {
        console.error('❌ Schema check failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
