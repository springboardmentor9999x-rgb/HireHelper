const pool = require('./src/config/db');

async function checkSchema() {
  try {
    console.log('📋 Checking tasks table schema...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ TASKS TABLE COLUMNS:');
    console.log('─'.repeat(70));
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} nullable=${row.is_nullable}`);
    });
    console.log('─'.repeat(70));
    
    // Check if priority exists
    const priorityCheck = result.rows.find(r => r.column_name === 'priority');
    if (priorityCheck) {
      console.log('\n✅ Priority column EXISTS');
    } else {
      console.log('\n❌ Priority column MISSING - needs to be added!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
