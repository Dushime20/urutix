const { Client } = require('pg');

async function checkForeignKeys() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check foreign key constraints on users table
    console.log('Foreign key constraints on users table:');
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='users'
    `);
    
    fkResult.rows.forEach(row => {
      console.log(`  ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // Check if the tenant exists
    console.log('\n🔍 Checking if test tenant exists...');
    const tenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';
    const tenantResult = await client.query('SELECT id, name, status FROM tenants WHERE id = $1', [tenantId]);
    
    if (tenantResult.rows.length > 0) {
      const tenant = tenantResult.rows[0];
      console.log(`✅ Tenant exists: ${tenant.name} (${tenant.status})`);
    } else {
      console.log('❌ Tenant not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkForeignKeys();