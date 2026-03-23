const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
  entities: [
    'dist/entities/*.entity.js',
  ],
  migrations: [
    'dist/migrations/*.js',
  ],
  subscribers: [],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function checkMigrations() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    // Check what migrations are recorded in the database
    console.log('\n=== Migrations recorded in database ===');
    const executedMigrations = await dataSource.query('SELECT * FROM migrations ORDER BY timestamp DESC');
    if (executedMigrations.length === 0) {
      console.log('No migrations found in database');
    } else {
      executedMigrations.forEach(migration => {
        const timestamp = migration.timestamp ? new Date(parseInt(migration.timestamp)).toISOString() : 'Unknown';
        console.log(`- ${migration.name} (${timestamp})`);
      });
    }

    // Check what migration files exist
    console.log('\n=== Migration files available ===');
    try {
      const migrationFiles = fs.readdirSync('dist/migrations').filter(file => file.endsWith('.js'));
      if (migrationFiles.length === 0) {
        console.log('No migration files found in dist/migrations');
      } else {
        migrationFiles.forEach(file => {
          console.log(`- ${file}`);
        });
      }
    } catch (error) {
      console.log('dist/migrations folder not found, checking source migrations...');
      try {
        const sourceMigrationFiles = fs.readdirSync('src/migrations').filter(file => file.endsWith('.ts'));
        sourceMigrationFiles.forEach(file => {
          console.log(`- ${file} (source)`);
        });
      } catch (srcError) {
        console.log('No migration files found');
      }
    }

    // Check pending migrations
    console.log('\n=== Pending migrations ===');
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      console.log('There are pending migrations');
    } else {
      console.log('No pending migrations');
    }

    // Check if specific tables exist
    console.log('\n=== Checking key tables ===');
    const tables = ['users', 'tenants', 'loads', 'trucks', 'drivers', 'insurance_claims'];
    for (const table of tables) {
      try {
        const result = await dataSource.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '${table}'`);
        const exists = result[0].count > 0;
        console.log(`- ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
      } catch (error) {
        console.log(`- ${table}: ERROR - ${error.message}`);
      }
    }

    await dataSource.destroy();
    console.log('\nCheck completed!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkMigrations();