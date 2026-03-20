const { Client } = require('pg');

async function checkUsersTableSchema() {
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
    
    // Check users table structure
    console.log('Users table structure:');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default || 'none'}`);
    });
    
    // Check constraints
    console.log('\nUsers table constraints:');
    const constraints = await client.query(`
      SELECT 
        constraint_name, 
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'users'
    `);
    
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.constraint_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTableSchema();