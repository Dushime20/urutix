const { Client } = require('pg');
require('dotenv').config();

async function checkPermissionsTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check for permissions-related tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions')
      ORDER BY table_name
    `);

    console.log('\n📊 Permissions-related tables:');
    if (result.rows.length === 0) {
      console.log('❌ NO PERMISSIONS TABLES FOUND!');
      console.log('\nThese tables are missing:');
      console.log('  - permissions');
      console.log('  - role_permissions');
      console.log('  - user_permissions');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
      
      // Check which ones are missing
      const existingTables = result.rows.map(r => r.table_name);
      const requiredTables = ['permissions', 'role_permissions', 'user_permissions'];
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log('\n❌ Missing tables:');
        missingTables.forEach(table => {
          console.log(`  - ${table}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkPermissionsTables()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
