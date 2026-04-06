/**
 * Database Migration: Add Priority Column to Tasks
 * 
 * This migration adds the missing 'priority' column to the tasks table
 * 
 * Usage:
 * node database-migration-priority.js
 */

const pool = require('./src/config/db');

async function addPriorityColumn() {
  try {
    console.log('🔄 Starting migration: Add Priority Column...\n');

    // Check if priority column already exists
    const checkColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'priority';
    `;
    
    const checkResult = await pool.query(checkColumn);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Priority column already exists. No action needed.');
      await pool.end();
      return;
    }

    // Add priority column
    console.log('📝 Adding priority column to tasks table...');
    const addColumn = `
      ALTER TABLE tasks
      ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
    `;
    
    await pool.query(addColumn);
    console.log('✅ Priority column added successfully');

    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'priority';
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log('\n✅ Priority column verified:');
      console.log(`   Name: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Default: ${col.column_default}`);
    }

    // Show all tasks table columns
    console.log('\n📋 Current Tasks Table Schema:');
    console.log('─'.repeat(60));
    
    const schemaQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    schemaResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '';
      const defaultVal = row.column_default ? ` = ${row.column_default}` : '';
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${nullable} ${defaultVal}`);
    });
    console.log('─'.repeat(60));

    console.log('\n✅ Migration completed successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('Error details:', err);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addPriorityColumn();
}

module.exports = addPriorityColumn;
