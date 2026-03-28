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
