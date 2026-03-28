ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);
