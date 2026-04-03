const pool = require("./db");

async function initDbSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (task_id, requester_id)
    );

    CREATE INDEX IF NOT EXISTS idx_requests_requester_created_at
      ON requests (requester_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_requests_owner_created_at
      ON requests (owner_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      message TEXT NOT NULL DEFAULT '',
      body TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
      ON notifications (user_id, created_at DESC);
  `);

  // Ensure both columns exist and keep backwards compatibility
  await pool.query(`
    ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS body TEXT;
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    UPDATE notifications
    SET message = COALESCE(NULLIF(message, ''), body)
    WHERE (message IS NULL OR message = '')
      AND body IS NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS notifications
    ALTER COLUMN message SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE requests r
    SET owner_id = t.user_id
    FROM tasks t
    WHERE r.task_id = t.id
      AND r.owner_id IS NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_requests_requester_created_at
      ON requests (requester_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_requests_owner_created_at
      ON requests (owner_id, created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_picture TEXT,
      ADD COLUMN IF NOT EXISTS profession VARCHAR(120),
      ADD COLUMN IF NOT EXISTS interests TEXT,
      ADD COLUMN IF NOT EXISTS experience_years INTEGER,
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS city VARCHAR(120),
      ADD COLUMN IF NOT EXISTS availability VARCHAR(120);
  `);

  await pool.query(`
    ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS urgency VARCHAR(20),
      ADD COLUMN IF NOT EXISTS tools_required BOOLEAN,
      ADD COLUMN IF NOT EXISTS vehicle_required BOOLEAN,
      ADD COLUMN IF NOT EXISTS contact_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS helpers_needed INTEGER,
      ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS special_instructions TEXT;
  `);
}

module.exports = {
  initDbSchema,
};
