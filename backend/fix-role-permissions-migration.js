const { Client } = require('pg');
require('dotenv').config();

async function fixRolePermissionsMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check current schema
    console.log('\n📋 Checking current role_permissions schema...');
    const currentSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'role_permissions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    console.table(currentSchema.rows);

    // Check if role_id column exists
    const hasRoleId = currentSchema.rows.some(col => col.column_name === 'role_id');
    const hasRole = currentSchema.rows.some(col => col.column_name === 'role');

    if (hasRoleId && hasRole) {
      console.log('\n⚠️  Both role and role_id columns exist. Dropping role_id...');
      await client.query('ALTER TABLE role_permissions DROP COLUMN IF EXISTS role_id CASCADE');
      console.log('✅ Dropped role_id column');
    }

    // Ensure role column is VARCHAR
    if (hasRole) {
      console.log('\n🔧 Ensuring role column is VARCHAR...');
      await client.query(`
        ALTER TABLE role_permissions 
        ALTER COLUMN role TYPE VARCHAR USING role::VARCHAR
      `);
      console.log('✅ Role column is VARCHAR');
    }

    // Check for any pending migrations that might add role_id
    console.log('\n📋 Checking migrations table...');
    const migrations = await client.query(`
      SELECT * FROM migrations 
      WHERE name LIKE '%role%' 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    
    if (migrations.rows.length > 0) {
      console.log('Recent role-related migrations:');
      console.table(migrations.rows);
    }

    // Verify final schema
    console.log('\n✅ Final schema:');
    const finalSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'role_permissions' 
      ORDER BY ordinal_position
    `);
    console.table(finalSchema.rows);

    // Check sample data
    const sampleData = await client.query('SELECT * FROM role_permissions LIMIT 5');
    console.log('\n📝 Sample data:');
    console.table(sampleData.rows);

    console.log('\n✅ Migration fix completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n✅ Connection closed');
  }
}

fixRolePermissionsMigration();
