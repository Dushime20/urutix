const { Pool } = require('pg');
require('dotenv').config();

async function checkTenantStatusEnum() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Checking tenant status enum values...\n');

    // Get enum values
    const enumQuery = await pool.query(`
      SELECT unnest(enum_range(NULL::tenants_status_enum)) AS enum_value;
    `);

    console.log('Valid tenant status values:');
    enumQuery.rows.forEach(row => {
      console.log(`  - "${row.enum_value}"`);
    });

    // Check current tenant statuses
    console.log('\nCurrent tenant statuses in database:');
    const statusQuery = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM tenants
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY status;
    `);

    console.table(statusQuery.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTenantStatusEnum();
