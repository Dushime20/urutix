/**
 * Mark Remaining Migrations as Executed
 * 
 * This script marks migrations that have schema conflicts as executed,
 * since the database already has the required schema from TypeORM sync.
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

async function markMigrations() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔧 Marking remaining migrations...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    // Migrations to mark as executed (they have schema conflicts but tables exist)
    const migrationsToMark = [
      '020_user_kyc_system_enhancement.sql',
      '021_cargo_owner_analytics_foundation.sql',
      '023_operational_analytics.sql',
      '025_ai_insights.sql',
      '026_advanced_analytics_phase4.sql',
    ];

    for (const migration of migrationsToMark) {
      await client.query(`
        INSERT INTO schema_migrations (migration_name, execution_time_ms, status, checksum)
        VALUES ($1, 0, 'success', 'synced')
        ON CONFLICT (migration_name) DO NOTHING
      `, [migration]);
      
      console.log(`✅ Marked: ${migration}`);
    }

    console.log('\n✅ All migrations marked!\n');
    console.log('Now run: npm run migrations:status\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

markMigrations();
