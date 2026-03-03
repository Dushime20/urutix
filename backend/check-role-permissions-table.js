const { Client } = require('pg');
require('dotenv').config();

async function checkRolePermissionsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'role_permissions'
      );
    `);
    
    console.log('\n📋 Table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Get table schema
      const schema = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'role_permissions' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Table Schema:');
      console.table(schema.rows);

      // Check for data
      const count = await client.query('SELECT COUNT(*) FROM role_permissions');
      console.log('\n📈 Total records:', count.rows[0].count);

      // Sample data
      const sample = await client.query('SELECT * FROM role_permissions LIMIT 5');
      console.log('\n📝 Sample data:');
      console.table(sample.rows);

      // Check constraints
      const constraints = await client.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'role_permissions'
      `);
      console.log('\n🔒 Constraints:');
      console.table(constraints.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n✅ Connection closed');
  }
}

checkRolePermissionsTable();
