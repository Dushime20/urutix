import { AppDataSource } from './src/data-source';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config();

const BATCH_SIZE = 3; // Run 3 migrations at a time

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
        console.log('✅ PostGIS extension ready');
      } catch (err: any) {
        console.log('⚠️  PostGIS not available (will skip geometry columns)');
      }
    }
    await client.end();
  } catch (error) {
    await client.end().catch(() => {});
  }
}

async function getPendingMigrations() {
  await AppDataSource.initialize();
  
  try {
    // Get all migration files
    const migrationFiles = AppDataSource.migrations.map(m => ({
      name: m.name,
      timestamp: m.name.match(/\d+/)?.[0] || '0',
    })).sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    // Get executed migrations
    const executed = await AppDataSource.query(`
      SELECT name FROM migrations ORDER BY timestamp
    `).catch(() => []);

    const executedNames = new Set(executed.map((e: any) => e.name));
    
    const pending = migrationFiles.filter(m => !executedNames.has(m.name));
    
    await AppDataSource.destroy();
    return pending;
  } catch (error) {
    await AppDataSource.destroy();
    return [];
  }
}

async function runMigrationBatch(migrations: any[], batchNum: number, totalBatches: number) {
  await AppDataSource.initialize();
  
  try {
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} - Running ${migrations.length} migration(s)...`);
    
    const results = [];
    for (const migration of migrations) {
      try {
        console.log(`  🔄 Running: ${migration.name}...`);
        
        // Run this specific migration
        const migrationInstance = AppDataSource.migrations.find(m => m.name === migration.name);
        if (migrationInstance) {
          await AppDataSource.query('BEGIN');
          try {
            await migrationInstance.up(AppDataSource.createQueryRunner());
            await AppDataSource.query(`
              INSERT INTO migrations (timestamp, name) 
              VALUES ($1, $2)
            `, [migration.timestamp, migration.name]);
            await AppDataSource.query('COMMIT');
            console.log(`  ✅ ${migration.name} completed`);
            results.push({ name: migration.name, status: 'success' });
          } catch (error: any) {
            await AppDataSource.query('ROLLBACK');
            throw error;
          }
        } else {
          // Try running via migration runner
          const executor = AppDataSource.migrations;
          const pending = executor.filter((m: any) => m.name === migration.name);
          if (pending.length > 0) {
            await AppDataSource.runMigrations({ 
              transaction: 'all',
              fake: false 
            });
            console.log(`  ✅ ${migration.name} completed`);
            results.push({ name: migration.name, status: 'success' });
          } else {
            throw new Error(`Migration ${migration.name} not found`);
          }
        }
      } catch (error: any) {
        console.error(`  ❌ ${migration.name} failed:`, error.message);
        results.push({ name: migration.name, status: 'failed', error: error.message });
        // Continue with next migration
      }
    }
    
    await AppDataSource.destroy();
    return results;
  } catch (error: any) {
    console.error(`❌ Batch ${batchNum} failed:`, error.message);
    await AppDataSource.destroy();
    return migrations.map(m => ({ name: m.name, status: 'failed', error: error.message }));
  }
}

async function runAllMigrationsBatched() {
  try {
    console.log('🚀 Starting batched migration process...\n');
    
    // Step 1: Check PostGIS
    await checkPostGIS();
    
    // Step 2: Get pending migrations
    console.log('\n📋 Checking pending migrations...');
    const pending = await getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('✅ All migrations are already executed!');
      return;
    }
    
    console.log(`Found ${pending.length} pending migration(s)\n`);
    
    // Step 3: Run in batches
    const batches = [];
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      batches.push(pending.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Will run in ${batches.length} batch(es) of up to ${BATCH_SIZE} migration(s) each\n`);
    
    const allResults = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const results = await runMigrationBatch(batch, i + 1, batches.length);
      allResults.push(...results);
      
      // Small delay between batches
      if (i < batches.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    const successful = allResults.filter(r => r.status === 'success');
    const failed = allResults.filter(r => r.status === 'failed');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      failed.forEach(f => {
        console.log(`  - ${f.name}: ${f.error}`);
      });
    }
    
    // Step 5: Verify tables
    await AppDataSource.initialize();
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Total tables in database: ${tables.length}`);
    if (tables.length > 0) {
      console.log('\nKey tables:');
      const keyTables = ['users', 'trucks', 'loads', 'drivers', 'trips', 'bids', 'payments'];
      keyTables.forEach(key => {
        const exists = tables.some((t: any) => t.table_name === key);
        console.log(`  ${exists ? '✅' : '❌'} ${key}`);
      });
    }
    
    await AppDataSource.destroy();
    
    console.log('\n✅ Batched migration process completed!');
    
  } catch (error: any) {
    console.error('\n❌ Migration process failed:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the batched migrations
runAllMigrationsBatched();

