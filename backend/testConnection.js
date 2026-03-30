require('dotenv').config();
const pool = require('./src/config/db');

async function testConnection() {
  console.log('🧪 Testing Database Connection...\n');

  // Test database connection
  try {
    console.log('Attempting to connect to:');
    console.log(`  Host: ${process.env.DB_HOST}`);
    console.log(`  Port: ${process.env.DB_PORT}`);
    console.log(`  Database: ${process.env.DB_NAME}`);
    console.log(`  User: ${process.env.DB_USER}\n`);

    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].now}\n`);

    // Check if tables exist
    console.log('📊 Checking tables...\n');

    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    console.log(usersTable.rows[0].exists ? '✅ users table exists' : '❌ users table missing');

    const tasksTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tasks'
      );
    `);
    console.log(tasksTable.rows[0].exists ? '✅ tasks table exists' : '❌ tasks table missing');

    // Count tasks
    if (tasksTable.rows[0].exists) {
      const taskCount = await pool.query('SELECT COUNT(*) FROM tasks');
      console.log(`   Total tasks in database: ${taskCount.rows[0].count}`);

      const userTaskCount = await pool.query(`
        SELECT user_id, COUNT(*) as count 
        FROM tasks 
        GROUP BY user_id
      `);
      console.log('   Tasks by user:');
      userTaskCount.rows.forEach(row => {
        console.log(`     - User ${row.user_id}: ${row.count} tasks`);
      });
    }

    console.log('\n✨ Database connection is working properly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL is not running or not accessible');
    } else if (error.code === '3D000') {
      console.error(`💡 Database "${process.env.DB_NAME}" does not exist`);
    }
    
    process.exit(1);
  }
}

testConnection();
