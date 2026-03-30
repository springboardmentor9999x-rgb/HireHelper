/**
 * Database Schema Initialization for Tasks
 * Run this file once to create the tasks table with proper schema
 * 
 * Usage:
 * node database-schema.js
 */

const pool = require('./src/config/db');

const createTasksTableSQL = `
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'other',
    budget DECIMAL(10, 2),
    location VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'OPEN',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMP,
    image VARCHAR(255),
    picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
`;

async function initializeDatabase() {
  try {
    console.log('📊 Initializing database schema...');
    
    // Enable UUID extension for better IDs (optional)
    // await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create tasks table
    await pool.query(createTasksTableSQL);
    
    console.log('✅ Tasks table created successfully');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Tasks Table Schema:');
    console.log('─'.repeat(50));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type}`);
    });
    console.log('─'.repeat(50));
    
    console.log('\n✅ Database initialization complete!');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
