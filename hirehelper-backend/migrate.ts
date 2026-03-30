import pool from './src/config/db';

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add category column
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'Other';
        `);
        console.log('Added category column.');

        // Add assignee_id column
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS assignee_id INTEGER REFERENCES users(id);
        `);
        console.log('Added assignee_id column.');

        // Add is_verified column
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
        `);
        console.log('Added is_verified column.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
