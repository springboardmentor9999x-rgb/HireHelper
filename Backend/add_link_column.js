const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    await pool.query('ALTER TABLE notification ADD COLUMN link VARCHAR(255)');
    console.log('Success');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
