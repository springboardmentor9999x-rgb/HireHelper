/**
 * Database Migration - Add Settings Fields to Users Table
 * Run this file to add new columns needed for the Settings module
 * 
 * Usage:
 * node database-migration-settings.js
 */

const pool = require('./src/config/db');

async function migrateDatabase() {
  try {
    console.log('📊 Running Settings Module Migration...\n');

    // Check if columns already exist and add them if they don't
    const alterUserTableSQL = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'English',
      ADD COLUMN IF NOT EXISTS profile_visibility BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
    `;

    console.log('⏳ Adding new columns to users table...');
    await pool.query(alterUserTableSQL);
    console.log('✅ Columns added successfully\n');

    // Verify the schema
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Updated Users Table Schema:');
    console.log('─'.repeat(70));
    result.rows.forEach(row => {
      const defaultVal = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)}${defaultVal}`);
    });
    console.log('─'.repeat(70));

    // Count existing users
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Total users in database: ${userCount.rows[0].count}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew Settings API endpoints available:');
    console.log('  GET    /api/settings');
    console.log('  PUT    /api/settings/notifications');
    console.log('  PUT    /api/settings/theme');
    console.log('  PUT    /api/settings/language');
    console.log('  PUT    /api/settings/privacy');
    console.log('  PUT    /api/settings/change-password');
    console.log('  DELETE /api/settings/delete-account');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;
