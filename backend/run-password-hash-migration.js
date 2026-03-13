const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runPasswordHashMigration() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '019_make_password_hash_nullable.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running migration: 019_make_password_hash_nullable.sql');
    console.log('SQL:', migrationSQL);
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the change
    console.log('\n🔍 Verifying passwordHash column is now nullable...');
    const result = await client.query(`
      SELECT 
        column_name, 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'passwordHash'
    `);
    
    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log(`passwordHash column: nullable = ${column.is_nullable}`);
      
      if (column.is_nullable === 'YES') {
        console.log('✅ SUCCESS: passwordHash is now nullable');
      } else {
        console.log('❌ FAILED: passwordHash is still not nullable');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

runPasswordHashMigration();