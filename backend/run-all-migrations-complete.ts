import { AppDataSource } from './src/data-source';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config();

async function checkAndCreatePostGIS() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    
    // Check if PostGIS is available
    const available = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'
      ) as available
    `);

    if (available.rows[0].available) {
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('✅ PostGIS extension created');
      } catch (err: any) {
        console.log('⚠️  PostGIS extension not available or requires superuser');
        console.log('   Continuing without PostGIS - geometry columns will be skipped');
      }
    } else {
      console.log('⚠️  PostGIS not available - geometry columns will be skipped');
    }

    await client.end();
  } catch (error) {
    console.error('Error checking PostGIS:', error);
    await client.end().catch(() => {});
  }
}

async function runSQLMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('\n📋 Running SQL migrations from backend/migrations...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  migrations directory not found, skipping SQL migrations');
      await client.end();
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No SQL migration files found');
      await client.end();
      return;
    }

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8').trim();
      
      if (!content) {
        console.log(`⏭️  Skipping ${file} (empty)`);
        continue;
      }

      console.log(`🔄 Running ${file}...`);
      try {
        await client.query('BEGIN');
        await client.query(content);
        await client.query('COMMIT');
        console.log(`✅ ${file} completed\n`);
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`❌ Error in ${file}:`, error.message);
        // Continue with other migrations
      }
    }

    await client.end();
  } catch (error: any) {
    console.error('❌ Error running SQL migrations:', error.message);
    await client.end().catch(() => {});
  }
}

async function runTypeORMMigrations() {
  try {
    console.log('\n🔄 Running TypeORM migrations...\n');
    await AppDataSource.initialize();
    
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ All TypeORM migrations are already up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    }

    // Check tables
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Database now has ${tables.length} tables`);
    if (tables.length > 0 && tables.length <= 20) {
      tables.forEach((table: any, i: number) => {
        console.log(`  ${i + 1}. ${table.table_name}`);
      });
    } else if (tables.length > 20) {
      console.log('  (showing first 20)');
      tables.slice(0, 20).forEach((table: any, i: number) => {
        console.log(`  ${i + 1}. ${table.table_name}`);
      });
      console.log(`  ... and ${tables.length - 20} more`);
    }

    await AppDataSource.destroy();
  } catch (error: any) {
    console.error('\n❌ Error running TypeORM migrations:');
    console.error(error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting migration process...\n');
    
    // Step 1: Check and create PostGIS if available
    await checkAndCreatePostGIS();
    
    // Step 2: Run TypeORM migrations (from src/database/migrations and src/migrations)
    await runTypeORMMigrations();
    
    // Step 3: Run SQL migrations (from backend/migrations)
    await runSQLMigrations();
    
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration process failed:', error.message);
    process.exit(1);
  }
}

main();

