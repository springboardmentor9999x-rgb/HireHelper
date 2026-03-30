require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('DELETE FROM requests')
  .then(r => { console.log(`✅ Deleted ${r.rowCount} request(s).`); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
