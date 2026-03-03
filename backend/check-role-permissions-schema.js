const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking role_permissions table schema...\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'role_permissions'
      ORDER BY ordinal_position
    `);

    console.log('📊 Columns in role_permissions table:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });

    // Sample data
    console.log('\n📊 Sample role_permissions data:');
    const sampleResult = await client.query(`
      SELECT * FROM role_permissions LIMIT 3
    `);
    console.log(JSON.stringify(sampleResult.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
