import pool from './src/config/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function verify() {
    try {
        console.log('--- Verifying Backend Enhancements ---');

        // 1. Verify schema columns again
        const schemaRes = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('bio', 'professional_title', 'picture_url', 'theme', 'notifications_enabled', 'reset_password_token', 'reset_password_expires');
        `);
        console.log(`Found ${schemaRes.rows.length} new columns in 'users' table.`);

        // 2. Mock a user and test settings/password reset token
        // Find an existing user or create a temporary one
        const userRes = await pool.query('SELECT id, email_id FROM users LIMIT 1');
        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            console.log(`Testing with user: ${user.email_id}`);

            // Test settings update
            await pool.query(
                "UPDATE users SET theme = 'dark', notifications_enabled = false WHERE id = $1",
                [user.id]
            );
            const updatedUser = await pool.query('SELECT theme, notifications_enabled FROM users WHERE id = $1', [user.id]);
            console.log('Settings Persistence Test:', updatedUser.rows[0].theme === 'dark' && updatedUser.rows[0].notifications_enabled === false ? 'PASSED' : 'FAILED');

            // Test Forgot Password token generation
            const token = crypto.randomBytes(32).toString('hex');
            const expiry = new Date(Date.now() + 3600000);
            await pool.query(
                'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
                [token, expiry, user.id]
            );
            const tokenUser = await pool.query('SELECT reset_password_token FROM users WHERE id = $1', [user.id]);
            console.log('Reset Token Persistence Test:', tokenUser.rows[0].reset_password_token === token ? 'PASSED' : 'FAILED');

            // Cleanup
            await pool.query(
                'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
                [user.id]
            );
        } else {
            console.log('No user found to test with.');
        }

        console.log('--- Verification Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
