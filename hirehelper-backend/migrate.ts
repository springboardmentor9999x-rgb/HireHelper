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

        // User profile and settings enhancements
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS picture_url TEXT,
            ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light',
            ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
        `);
        console.log('Added user profile and settings columns.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
