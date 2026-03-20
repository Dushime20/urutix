const { Client } = require('pg');

async function checkTables() {
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
    
    console.log('Checking required tables...');
    
    const tables = ['users', 'user_profiles', 'tenants', 'password_reset_tokens'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`);
        console.log(`${table}: ${result.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
      } catch (error) {
        console.log(`${table}: ❌ ERROR - ${error.message}`);
      }
    }
    
    // Also check if password_reset_tokens table has the right structure
    try {
      const result = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'password_reset_tokens' ORDER BY ordinal_position`);
      if (result.rows.length > 0) {
        console.log('\npassword_reset_tokens table structure:');
        result.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type}`);
        });
      }
    } catch (error) {
      console.log('Error checking password_reset_tokens structure:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();