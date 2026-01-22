const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function inspectSchema() {
  try {
    const res = await pool.query("SELECT * FROM loads LIMIT 1");
    if (res.rows.length > 0) {
        console.log("Columns:", Object.keys(res.rows[0]));
    } else {
        console.log("No loads found to inspect.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

inspectSchema();
