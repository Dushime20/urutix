const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixMigrationConflict() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read and execute the SQL fix
    const sqlPath = path.join(__dirname, 'skip-conflicting-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔧 Executing migration fix...\n');
    await client.query(sql);
    
    console.log('✅ Migration conflict resolved!\n');

    // Verify the fix
    console.log('📋 Verifying role_permissions structure:');
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'role_permissions' 
      ORDER BY ordinal_position
    `);
    console.table(schema.rows);

    // Check migrations
    console.log('\n📋 Checking migrations table:');
    const migrations = await client.query(`
      SELECT * FROM migrations 
      WHERE name LIKE '%Permission%' OR name LIKE '%Role%'
      ORDER BY timestamp DESC
    `);
    console.table(migrations.rows);

    console.log('\n✅ All done! You can now restart the backend server.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixMigrationConflict();
