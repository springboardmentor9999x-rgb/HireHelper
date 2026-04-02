import pool from './db';

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // 1. Add proof fields to tasks table
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS proof_note TEXT,
            ADD COLUMN IF NOT EXISTS proof_picture_url TEXT;
        `);
        console.log('Added proof fields to tasks table.');

        // 2. Fix proof columns if they were created as VARCHAR(255)
        await pool.query(`
            ALTER TABLE tasks
            ALTER COLUMN proof_note TYPE TEXT,
            ALTER COLUMN proof_picture_url TYPE TEXT;
        `);
        console.log('Ensured proof fields are TEXT type.');

        // 2. Create reviews table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                reviewer_id INTEGER REFERENCES users(id),
                reviewee_id INTEGER REFERENCES users(id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created reviews table.');

        // 3. Update tasks status check if necessary (assume it's checked by logic)
        // 4. Update requests status to include 'CANCELLED' if needed
        // Assuming status is just a string in the DB

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Don't close the pool if it's shared, but since this is a one-off:
        // pool.end();
    }
};

export default migrate;
