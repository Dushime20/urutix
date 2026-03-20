
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function checkTruckCols() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trucks'");
    console.table(res.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTruckCols();
