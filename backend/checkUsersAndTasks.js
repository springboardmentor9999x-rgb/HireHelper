require('dotenv').config();
const pool = require('./src/config/db');

async function checkUsersAndTasks() {
  try {
    console.log('📋 Checking Users and Tasks:\n');

    // Get all users
    const usersResult = await pool.query('SELECT id, email, first_name, last_name FROM users');
    console.log(`✅ Total Users: ${usersResult.rows.length}`);
    console.log('Users:');
    usersResult.rows.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.first_name} ${user.last_name})`);
      console.log(`     ID: ${user.id}`);
    });

    console.log('\n');

    // Get all tasks with user email
    const tasksResult = await pool.query(`
      SELECT t.id, t.title, t.description, t.user_id, u.email, t.created_at
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    console.log(`✅ Total Tasks: ${tasksResult.rows.length}`);
    console.log('Tasks:');
    tasksResult.rows.forEach((task, i) => {
      console.log(`  ${i + 1}. "${task.title}"`);
      console.log(`     Created by: ${task.email} (ID: ${task.user_id})`);
      console.log(`     Created: ${task.created_at}`);
    });

    console.log('\n💡 For tasks to show:');
    console.log('   1. Log in with the email that created the tasks');
    console.log('   2. Or create a new task while logged in');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersAndTasks();
