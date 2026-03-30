const pool = require('./src/config/db');

/**
 * Database Migration - Create Notifications Table
 * Run this once to set up the notifications table
 */

async function migrateNotifications() {
  try {
    console.log('📊 Running Notifications Table Migration...\n');

    console.log('⏳ Creating notifications table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `;

    await pool.query(createTableQuery);

    console.log('✅ Notifications table created successfully\n');

    // Show schema
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;

    const schemaResult = await pool.query(schemaQuery);

    console.log('📋 Notifications Table Schema:');
    console.log('──────────────────────────────────────────────────────────────────────');
    schemaResult.rows.forEach((col) => {
      let defaultVal = col.column_default ? ` (default: ${col.column_default.substring(0, 50)})` : '';
      let nullable = col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      console.log(
        `  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`
      );
    });
    console.log('──────────────────────────────────────────────────────────────────────\n');

    console.log('✅ Migration completed successfully!\n');

    console.log('Available Notification API Endpoints:');
    console.log('  GET    /api/notifications');
    console.log('  GET    /api/notifications/unread-count');
    console.log('  PUT    /api/notifications/read/:notificationId');
    console.log('  POST   /api/notifications/create');
    console.log('  DELETE /api/notifications/:notificationId\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    process.exit(1);
  }
}

migrateNotifications();
