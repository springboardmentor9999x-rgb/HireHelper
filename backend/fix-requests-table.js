/**
 * Fix Requests Table - Add missing updated_at column
 */

const pool = require('./src/config/db');

async function fixRequestsTable() {
  try {
    console.log('🔧 Checking requests table structure...\n');

    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'updated_at'
      );
    `);

    const columnExists = checkColumn.rows[0].exists;

    if (!columnExists) {
      console.log('⏳ Adding updated_at column to requests table...');
      await pool.query(`
        ALTER TABLE requests 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Column added successfully!\n');
    } else {
      console.log('✅ Column already exists!\n');
    }

    // Show final schema
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'requests'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Updated Requests Table Schema:');
    console.log('─'.repeat(70));
    result.rows.forEach(row => {
      const defaultVal = row.column_default ? ` (${row.column_default})` : '';
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)}${defaultVal}`);
    });
    console.log('─'.repeat(70));
    console.log('\n✅ Fix completed! Now you can accept/reject requests.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

fixRequestsTable();
