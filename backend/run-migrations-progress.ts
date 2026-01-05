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
        return true;
      } catch (err: any) {
        console.log('⚠️  PostGIS not available (geometry columns may fail)\n');
        return false;
      }
    } else {
      console.log('⚠️  PostGIS not installed (geometry columns may fail)\n');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not check PostGIS\n');
    return false;
  } finally {
    await client.end();
  }
}

async function runMigrationsWithProgress() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    // Get pending migrations
    console.log('📋 Checking migration status...');
    const pendingMigrations = await AppDataSource.showMigrations();
    
    if (!pendingMigrations || pendingMigrations.length === 0) {
      console.log('✅ All migrations are already executed!\n');
      await AppDataSource.destroy();
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`);
    });
    console.log('');

    // Run migrations with progress tracking
    console.log('🔄 Running migrations (this may take a while)...\n');
    console.log('='.repeat(60));
    
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    try {
      // Use TypeORM's built-in migration runner
      const executedMigrations = await AppDataSource.runMigrations({
        transaction: 'all',
      });

      successCount = executedMigrations.length;
      
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Successfully executed ${successCount} migration(s)\n`);
      
      executedMigrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ✅ ${migration.name}`);
      });
      
    } catch (error: any) {
      console.error('\n❌ Error during migration execution:');
      console.error(`   ${error.message}\n`);
      
      // Try to continue with individual migrations
      console.log('🔄 Attempting to run migrations individually...\n');
      
      const migrationExecutor = AppDataSource.migrations;
      for (const migration of migrationExecutor) {
        try {
          // Check if already executed
          const executed = await AppDataSource.query(`
            SELECT COUNT(*) as count FROM migrations WHERE name = $1
          `, [migration.name]);
          
          if (parseInt(executed[0].count) > 0) {
            console.log(`  ⏭️  ${migration.name} (already executed)`);
            continue;
          }
          
          console.log(`  🔄 Running ${migration.name}...`);
          await AppDataSource.query('BEGIN');
          try {
            await migration.up(AppDataSource.createQueryRunner());
            const timestamp = migration.name.match(/\d+/)?.[0] || Date.now().toString();
            await AppDataSource.query(`
              INSERT INTO migrations (timestamp, name) VALUES ($1, $2)
            `, [timestamp, migration.name]);
            await AppDataSource.query('COMMIT');
            console.log(`  ✅ ${migration.name} completed`);
            successCount++;
          } catch (migrationError: any) {
            await AppDataSource.query('ROLLBACK');
            console.error(`  ❌ ${migration.name} failed: ${migrationError.message}`);
            failCount++;
            // Continue with next migration
          }
        } catch (err: any) {
          console.error(`  ❌ Error processing ${migration.name}: ${err.message}`);
          failCount++;
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏱️  Duration: ${duration} seconds\n`);

    // Verify tables
    console.log('📊 Verifying database tables...\n');
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    console.log(`✅ Total tables created: ${tables.length}\n`);
    
    if (tables.length > 0) {
      console.log('Key tables status:');
      const keyTables = [
        'users', 'user_profiles', 'trucks', 'loads', 'drivers', 
        'trips', 'bids', 'payments', 'tenants', 'locations'
      ];
      
      keyTables.forEach(key => {
        const exists = tables.some((t: any) => t.table_name === key);
        console.log(`  ${exists ? '✅' : '❌'} ${key}`);
      });
      
      if (tables.length <= 30) {
        console.log('\nAll tables:');
        tables.forEach((table: any, i: number) => {
          console.log(`  ${i + 1}. ${table.table_name}`);
        });
      } else {
        console.log(`\n(showing first 30 of ${tables.length} tables)`);
        tables.slice(0, 30).forEach((table: any, i: number) => {
          console.log(`  ${i + 1}. ${table.table_name}`);
        });
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
  console.log('='.repeat(60));
  console.log('🚀 Batched Migration Runner');
  console.log('='.repeat(60));
  console.log('');
  
  // Check PostGIS
  await checkPostGIS();
  
  // Run migrations
  await runMigrationsWithProgress();
}

main();

