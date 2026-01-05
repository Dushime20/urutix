import { AppDataSource } from './src/data-source';
import { Client } from 'pg';
import { config } from 'dotenv';

config();

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
    const available = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'
      ) as available
    `);

    if (available.rows[0].available) {
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('✅ PostGIS extension ready\n');
      } catch (err: any) {
        console.log('⚠️  PostGIS not available (some geometry columns may fail)\n');
      }
    } else {
      console.log('⚠️  PostGIS not installed (some geometry columns may fail)\n');
    }
  } catch (error) {
    console.log('⚠️  Could not check PostGIS\n');
  } finally {
    await client.end();
  }
}

async function runMigrationsOneByOne() {
  try {
    console.log('🚀 Starting migration process...\n');
    console.log('='.repeat(70));
    
    // Initialize connection
    console.log('📡 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected successfully\n');

    // Get all migrations
    const allMigrations = AppDataSource.migrations;
    console.log(`📋 Found ${allMigrations.length} total migration(s)\n`);

    // Get already executed migrations
    let executedMigrations: any[] = [];
    try {
      executedMigrations = await AppDataSource.query(`
        SELECT name FROM migrations ORDER BY timestamp
      `);
    } catch (error) {
      // Migrations table doesn't exist yet, will be created
      console.log('ℹ️  Migrations table will be created\n');
    }

    const executedNames = new Set(executedMigrations.map((e: any) => e.name));
    
    // Filter pending migrations and sort by timestamp
    const pendingMigrations = allMigrations
      .filter(m => !executedNames.has(m.name))
      .sort((a, b) => {
        const aTime = a.name.match(/\d+/)?.[0] || '0';
        const bTime = b.name.match(/\d+/)?.[0] || '0';
        return parseInt(aTime) - parseInt(bTime);
      });

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are already executed!\n');
      await AppDataSource.destroy();
      return;
    }

    console.log(`🔄 Will execute ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name}`);
    });
    console.log('');

    // Run migrations one by one
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < pendingMigrations.length; i++) {
      const migration = pendingMigrations[i];
      const migrationNum = i + 1;
      const total = pendingMigrations.length;

      console.log('='.repeat(70));
      console.log(`[${migrationNum}/${total}] Running: ${migration.name}`);
      console.log('='.repeat(70));

      try {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // Execute the migration
          await migration.up(queryRunner);
          
          // Record in migrations table
          const timestamp = migration.name.match(/\d+/)?.[0] || Date.now().toString();
          await queryRunner.query(`
            INSERT INTO migrations (timestamp, name) 
            VALUES ($1, $2)
          `, [timestamp, migration.name]);

          await queryRunner.commitTransaction();
          console.log(`✅ [${migrationNum}/${total}] ${migration.name} - SUCCESS\n`);
          successCount++;

        } catch (migrationError: any) {
          await queryRunner.rollbackTransaction();
          throw migrationError;
        } finally {
          await queryRunner.release();
        }

        // Small delay between migrations
        if (i < pendingMigrations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error: any) {
        console.error(`❌ [${migrationNum}/${total}] ${migration.name} - FAILED`);
        console.error(`   Error: ${error.message}\n`);
        failCount++;
        
        // Continue with next migration
        continue;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('='.repeat(70) + '\n');

    // Verify tables
    console.log('📊 Verifying database tables...\n');
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);

    console.log(`✅ Total tables in database: ${tables.length}\n`);

    if (tables.length > 0) {
      console.log('Key tables status:');
      const keyTables = [
        'users', 'user_profiles', 'trucks', 'loads', 'drivers', 
        'trips', 'bids', 'payments', 'tenants', 'locations',
        'auctions', 'notifications', 'documents'
      ];

      keyTables.forEach(key => {
        const exists = tables.some((t: any) => t.table_name === key);
        console.log(`  ${exists ? '✅' : '❌'} ${key}`);
      });

      console.log('\nAll tables created:');
      if (tables.length <= 50) {
        tables.forEach((table: any, i: number) => {
          console.log(`  ${(i + 1).toString().padStart(3)}. ${table.table_name}`);
        });
      } else {
        tables.slice(0, 50).forEach((table: any, i: number) => {
          console.log(`  ${(i + 1).toString().padStart(3)}. ${table.table_name}`);
        });
        console.log(`  ... and ${tables.length - 50} more tables`);
      }
    }

    await AppDataSource.destroy();
    console.log('\n✅ Migration process completed!\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 MIGRATION RUNNER - One by One Execution');
  console.log('='.repeat(70));
  console.log('');

  // Check PostGIS
  await checkPostGIS();

  // Run migrations
  await runMigrationsOneByOne();
}

main();

