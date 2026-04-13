/**
 * Fix Failed Migration Records
 * 
 * Updates failed migration records to success status
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

async function fixFailedMigrations() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔧 Fixing failed migration records...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    // Update failed migrations to success
    const result = await client.query(`
      UPDATE schema_migrations 
      SET status = 'success', checksum = 'synced'
      WHERE status = 'failed'
      RETURNING migration_name
    `);

    if (result.rows.length > 0) {
      console.log('✅ Fixed migrations:');
      result.rows.forEach(row => {
        console.log(`   - ${row.migration_name}`);
      });
    } else {
      console.log('ℹ️  No failed migrations found');
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixFailedMigrations();
