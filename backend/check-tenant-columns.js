const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='tenants' 
    ORDER BY ordinal_position
  `);
  console.log('Tenant table columns:', result.rows.map(r => r.column_name).join(', '));
  await pool.end();
}

checkColumns();
