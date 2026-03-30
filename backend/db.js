const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection immediately when this module is imported
pool
  .connect()
  .then((client) => {
    console.log('✅ Database connected to PostgreSQL');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.stack);
  });

// Listen for connection events
pool.on('connect', () => {
  console.log('✅ Connected to Postgres');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

module.exports = pool;
