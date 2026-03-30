/**
 * Database Migration - Add missing task fields
 * Run this file to add category and budget columns to tasks table
 * 
 * Usage:
 * node database-migration-add-task-fields.js
 */

const pool = require('./src/config/db');

const addColumnsSQL = `
  -- Add category column if it doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='category') THEN
      ALTER TABLE tasks ADD COLUMN category VARCHAR(100) DEFAULT 'other';
      RAISE INFO 'Added category column';
    ELSE
      RAISE INFO 'category column already exists';
    END IF;
  END $$;

  -- Add budget column if it doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='budget') THEN
      ALTER TABLE tasks ADD COLUMN budget DECIMAL(10, 2);
      RAISE INFO 'Added budget column';
    ELSE
      RAISE INFO 'budget column already exists';
    END IF;
  END $$;
`;

async function runMigration() {
  try {
    console.log('📊 Running database migration: Adding missing task fields...');
    
    // Execute the migration
    await pool.query(addColumnsSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Updated Tasks Table Schema:');
    console.log('─'.repeat(50));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type}`);
    });
    console.log('─'.repeat(50));
    
    console.log('\n✅ Database migration complete!');
  } catch (err) {
    console.error('❌ Database migration failed:', err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
