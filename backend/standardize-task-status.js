/**
 * Standardize Task Status Values
 * Convert all task status values to lowercase for consistency
 */

const pool = require('./src/config/db');

async function standardizeStatus() {
  try {
    console.log('🔧 Standardizing task status values...\n');

    console.log('⏳ Converting all status values to lowercase...');
    await pool.query(`
      UPDATE tasks 
      SET status = LOWER(status)
      WHERE status IS NOT NULL
    `);
    
    console.log('✅ Status values standardized\n');

    // Verify
    const result = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
      ORDER BY status
    `);

    console.log('📋 Task Status Distribution:');
    console.log('─'.repeat(40));
    result.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(20)} ${row.count} tasks`);
    });
    console.log('─'.repeat(40));

    console.log('\n✅ Standardization complete!');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

standardizeStatus();
