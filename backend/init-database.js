#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes a fresh database by:
 * 1. Creating all tables from TypeORM entities (synchronize)
 * 2. Running any additional SQL migrations if needed
 * 3. Seeding initial admin user
 * 
 * Usage: node init-database.js
 */

const { DataSource } = require('typeorm');
const { execSync } = require('child_process');
require('dotenv').config();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Database configuration with synchronize enabled
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: true, // This will auto-create tables from entities
  logging: false,
  entities: [
    'dist/**/*.entity.js',
  ],
  migrations: [],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  log('\n' + '='.repeat(80), colors.blue);
  log('DATABASE INITIALIZATION', colors.blue);
  log('='.repeat(80) + '\n', colors.blue);

  try {
    // Step 1: Connect and synchronize
    logInfo('Connecting to database...');
    logInfo(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    await AppDataSource.initialize();
    logSuccess('Connected to database');

    logInfo('Creating tables from entities (this may take a minute)...');
    // Synchronize is already enabled, so tables are created on initialize
    logSuccess('All tables created successfully from entities');

    // Step 2: Verify tables were created
    const tables = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    logSuccess(`Created ${tables.length} tables`);
    logInfo('Sample tables: ' + tables.slice(0, 10).map(t => t.tablename).join(', ') + '...');

    // Step 3: Close connection
    await AppDataSource.destroy();
    logSuccess('Database initialization complete!');

    log('\n' + '='.repeat(80), colors.green);
    log('NEXT STEPS', colors.green);
    log('='.repeat(80) + '\n', colors.green);
    
    logInfo('1. Seed admin user: npm run seed:admin');
    logInfo('2. Start the application');
    log('');

    process.exit(0);

  } catch (error) {
    logError(`Initialization failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
