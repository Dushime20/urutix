/**
 * Sync Migrations with Existing Database
 * 
 * This script marks all migrations as executed if their tables already exist.
 * Use this when you have an existing database that was created with TypeORM sync
 * and you want to start using migrations.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

async function syncMigrations() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔄 Syncing migrations with existing database...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('rollback') && !file.includes('000_complete'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files\n`);

    // Get all existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);

    const existingTables = new Set(tablesResult.rows.map(r => r.table_name));
    console.log(`Found ${existingTables.size} existing tables\n`);

    // Check which migrations should be marked as executed
    let marked = 0;
    let skipped = 0;

    for (const migrationFile of migrationFiles) {
      // Check if already executed
      const executed = await client.query(`
        SELECT id FROM schema_migrations WHERE migration_name = $1
      `, [migrationFile]);

      if (executed.rows.length > 0) {
        console.log(`⏭️  ${migrationFile} - already marked`);
        skipped++;
        continue;
      }

      // Read migration file to see what tables it creates
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');

      // Extract table names from CREATE TABLE statements
      const tableMatches = migrationContent.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/gi);
      
      if (tableMatches) {
        const migrationTables = tableMatches.map(match => {
          const tableName = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i)[1];
          return tableName.toLowerCase();
        });

        // Check if any of the tables from this migration exist
        const tablesExist = migrationTables.some(table => existingTables.has(table));

        if (tablesExist) {
          // Mark as executed
          await client.query(`
            INSERT INTO schema_migrations (migration_name, execution_time_ms, status, checksum)
            VALUES ($1, 0, 'success', 'synced')
            ON CONFLICT (migration_name) DO NOTHING
          `, [migrationFile]);

          console.log(`✅ ${migrationFile} - marked as executed (tables exist: ${migrationTables.join(', ')})`);
          marked++;
        } else {
          console.log(`⏳ ${migrationFile} - pending (tables don't exist yet)`);
        }
      } else {
        // No CREATE TABLE found, might be ALTER TABLE or other DDL
        // Mark as executed to be safe
        await client.query(`
          INSERT INTO schema_migrations (migration_name, execution_time_ms, status, checksum)
          VALUES ($1, 0, 'success', 'synced')
          ON CONFLICT (migration_name) DO NOTHING
        `, [migrationFile]);

        console.log(`✅ ${migrationFile} - marked as executed (no tables to check)`);
        marked++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('SYNC SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total migrations: ${migrationFiles.length}`);
    console.log(`Marked as executed: ${marked}`);
    console.log(`Already marked: ${skipped}`);
    console.log(`Pending: ${migrationFiles.length - marked - skipped}`);
    console.log('');

    console.log('✅ Sync complete!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run migrations:status');
    console.log('2. Run: npm run migrations:run (to execute any pending migrations)');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

syncMigrations();
