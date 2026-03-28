CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  urgency VARCHAR(20),
  tools_required BOOLEAN,
  vehicle_required BOOLEAN,
  contact_method VARCHAR(50),
  budget NUMERIC(10, 2),
  helpers_needed INTEGER,
  duration_hours NUMERIC(5, 2),
  special_instructions TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  picture TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_created_at
  ON tasks (user_id, created_at DESC);
