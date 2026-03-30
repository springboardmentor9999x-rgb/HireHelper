const { Pool } = require("pg");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../../.env') });

// Build connection string
const connectionString = 
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log("🔍 DB Connection String:", connectionString.replace(/:[^@]*@/, ':***@'));

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: connectionString,

  // Enable SSL only in production
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test database connection (non-blocking)
pool
  .connect()
  .then((client) => {
    console.log("✅ Database Connected Successfully");
    client.release();
  })
  .catch((err) => {
    console.warn("⚠️  Database Connection Error:", err.message);
    console.warn("Continuing without database connection...");
  });

module.exports = pool;