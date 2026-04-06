/**
 * Test the request endpoint
 */
const http = require('http');

// Get the first task and user for testing
const pool = require('./src/config/db');

async function testRequest() {
  try {
    // Get a task
    const taskResult = await pool.query('SELECT id FROM tasks LIMIT 1');
    if(!taskResult.rows.length) {
      console.error('No tasks found');
      await pool.end();
      return;
    }
    
    const taskId = taskResult.rows[0].id;
    console.log('Task ID:', taskId);
    
    // Get a user (not the task owner)
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if(!userResult.rows.length) {
      console.error('No users found');
      await pool.end();
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('User ID:', userId);
    
    // Get auth token (this is just a simulation)
    console.log('\n📨 Testing POST /api/requests');
    console.log('Request body:', { task_id: taskId });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

testRequest();
