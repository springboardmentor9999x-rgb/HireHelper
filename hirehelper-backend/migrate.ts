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

        // Add proof fields
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS proof_note TEXT,
            ADD COLUMN IF NOT EXISTS proof_picture_url TEXT;
        `);
        console.log('Added proof fields.');

        // Fix proof columns type (in case they were created as VARCHAR(255))
        await pool.query(`
            ALTER TABLE tasks
            ALTER COLUMN proof_note TYPE TEXT,
            ALTER COLUMN proof_picture_url TYPE TEXT;
        `);
        console.log('Ensured proof fields are TEXT type.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
