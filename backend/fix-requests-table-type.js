/**
 * Fix Requests Table - Change task_id from UUID to INTEGER
 * This script drops and recreates the requests table with correct types
 */

const pool = require('./src/config/db');

async function fixRequestsTable() {
  try {
    console.log('🔧 Fixing requests table schema...\n');

    // Drop existing requests table
    console.log('⏳ Dropping existing requests table...');
    await pool.query('DROP TABLE IF EXISTS requests CASCADE');
    console.log('✅ Dropped existing table\n');

    // Create requests table with correct schema
    const createRequestsTableSQL = `
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_requests_task_id ON requests(task_id);
      CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    `;

    console.log('⏳ Creating requests table with corrected schema...');
    await pool.query(createRequestsTableSQL);
    console.log('✅ Requests table created successfully\n');

    // Verify the schema
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'requests'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Updated Requests Table Schema:');
    console.log('─'.repeat(70));
    result.rows.forEach(row => {
      const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(35)}${defaultValue}`);
    });
    console.log('─'.repeat(70));

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew Request API endpoints available:');
    console.log('  POST   /api/requests              (Send request)');
    console.log('  GET    /api/requests/my           (My requests)');
    console.log('  GET    /api/requests/received     (Received requests)');
    console.log('  GET    /api/requests/:id          (Get request details)');
    console.log('  PUT    /api/requests/:id/accept   (Accept request)');
    console.log('  PUT    /api/requests/:id/reject   (Reject request)');
    console.log('  DELETE /api/requests/:id          (Cancel request)\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

fixRequestsTable();
