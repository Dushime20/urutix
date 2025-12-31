const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { Client } = require('pg');
require('dotenv').config();

async function checkPostGIS() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'
      ) as available
    `);

    if (result.rows[0].available) {
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('✅ PostGIS extension ready\n');
      } catch (err) {
        console.log('⚠️  PostGIS not available\n');
      }
    }
  } catch (error) {
    // Ignore
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  console.log('🚀 Running all migrations...\n');
  console.log('='.repeat(70));
  
  try {
    const { stdout, stderr } = await execAsync('npm run migration:run', {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ Migrations completed!\n');
    
    // Verify tables
    await verifyTables();
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    
    // Still verify tables in case some were created
    await verifyTables();
    process.exit(1);
  }
}

async function verifyTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);

    console.log('='.repeat(70));
    console.log('📊 DATABASE VERIFICATION');
    console.log('='.repeat(70));
    console.log(`✅ Total tables: ${result.rows.length}\n`);

    if (result.rows.length > 0) {
      const keyTables = [
        'users', 'user_profiles', 'trucks', 'loads', 'drivers', 
        'trips', 'bids', 'payments', 'tenants', 'locations'
      ];

      console.log('Key tables:');
      keyTables.forEach(key => {
        const exists = result.rows.some(r => r.table_name === key);
        console.log(`  ${exists ? '✅' : '❌'} ${key}`);
      });

      console.log('\nAll tables:');
      result.rows.forEach((row, i) => {
        console.log(`  ${(i + 1).toString().padStart(3)}. ${row.table_name}`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('Error verifying tables:', error.message);
    await client.end().catch(() => {});
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 MIGRATION RUNNER');
  console.log('='.repeat(70));
  console.log('');
  
  await checkPostGIS();
  await runMigrations();
  
  console.log('\n✅ Process completed!\n');
}

main().catch(console.error);
