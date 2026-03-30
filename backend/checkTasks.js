const pool = require('./src/config/db');

async function checkTasks() {
  try {
    const result = await pool.query(
      'SELECT id, user_id, title, status FROM tasks ORDER BY id DESC LIMIT 20'
    );

    console.log('\n📋 Tasks in Database:');
    console.log('─'.repeat(80));
    result.rows.forEach(t => {
      console.log(`ID: ${t.id.toString().padEnd(3)} | User: ${t.user_id.toString().padEnd(36)} | Status: ${(t.status || 'NULL').padEnd(10)} | ${t.title}`);
    });
    console.log('─'.repeat(80));

    // Check for OPEN tasks
    const openTasks = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'OPEN'");
    console.log(`\n✅ Total OPEN tasks: ${openTasks.rows[0].count}`);

    // Check unique users
    const users = await pool.query("SELECT DISTINCT user_id FROM tasks");
    console.log(`👥 Unique task creators: ${users.rows.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTasks();
