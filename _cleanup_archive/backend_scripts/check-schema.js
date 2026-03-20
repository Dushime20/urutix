const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix'
  });

  try {
    await client.connect();
    
    // Check tenants table
    console.log('=== TENANTS TABLE ===');
    const tenantsResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    tenantsResult.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type}${r.character_maximum_length ? `(${r.character_maximum_length})` : ''} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check activity_logs table
    console.log('\n=== ACTIVITY_LOGS TABLE ===');
    const activityResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' 
      ORDER BY ordinal_position
    `);
    activityResult.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type}${r.character_maximum_length ? `(${r.character_maximum_length})` : ''} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSchema();
