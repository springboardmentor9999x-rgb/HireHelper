/**
 * Database Migration - Add Profile Fields to Users Table
 * Run this file to add missing profile columns (bio, profile_picture)
 * 
 * Usage:
 * node database-migration-profile-fields.js
 */

const pool = require('./src/config/db');

async function migrateDatabase() {
  try {
    console.log('📊 Running Profile Fields Migration...\n');

    // Add missing profile fields to users table
    const alterUserTableSQL = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS profile_picture TEXT;
    `;

    console.log('⏳ Adding profile fields to users table...');
    await pool.query(alterUserTableSQL);
    console.log('✅ Profile fields added successfully\n');

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
    console.log('\nProfile fields are now available:');
    console.log('  - bio (TEXT): User biography/about section');
    console.log('  - profile_picture (LONGTEXT): Base64 encoded profile picture');
    
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
