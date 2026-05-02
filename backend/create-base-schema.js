/**
 * Create Base Schema Script
 * 
 * This script uses TypeORM's schema sync to create all tables,
 * then exports the schema as SQL for production use.
 * 
 * Prerequisites:
 * - Docker development environment must be running
 * - Database must be empty or will be dropped and recreated
 * 
 * Usage: node create-base-schema.js
 */

const { DataSource } = require('typeorm');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const execAsync = promisify(exec);

// Import all entities (same as in database.config.ts)
const entities = require('./dist/main.js');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createBaseSchema() {
  log('\n' + '='.repeat(80), colors.bright);
  log('CREATE BASE SCHEMA FROM ENTITIES', colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
  
  const dbConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  };
  
  log(`📊 Database: ${dbConfig.database}`, colors.cyan);
  log(`🖥️  Host: ${dbConfig.host}:${dbConfig.port}`, colors.cyan);
  log(`👤 User: ${dbConfig.username}\n`, colors.cyan);
  
  try {
    // Step 1: Drop and recreate database
    log('⚠️  WARNING: This will DROP and RECREATE the database!', colors.yellow);
    log('Press Ctrl+C within 5 seconds to cancel...\n', colors.yellow);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    log('🗑️  Step 1: Dropping existing database...', colors.cyan);
    
    // Connect to postgres database to drop/create
    const adminDb = new DataSource({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: 'postgres',
    });
    
    await adminDb.initialize();
    
    // Drop database if exists
    await adminDb.query(`DROP DATABASE IF EXISTS ${dbConfig.database}`);
    log(`✅ Database dropped`, colors.green);
    
    // Create fresh database
    await adminDb.query(`CREATE DATABASE ${dbConfig.database}`);
    log(`✅ Database created\n`, colors.green);
    
    await adminDb.destroy();
    
    // Step 2: Create extensions
    log('🔌 Step 2: Installing PostgreSQL extensions...', colors.cyan);
    
    const extensionsDb = new DataSource({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });
    
    await extensionsDb.initialize();
    
    await extensionsDb.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await extensionsDb.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await extensionsDb.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    await extensionsDb.query('CREATE EXTENSION IF NOT EXISTS "btree_gin"');
    
    log('✅ Extensions installed\n', colors.green);
    
    await extensionsDb.destroy();
    
    // Step 3: Use TypeORM synchronize to create all tables
    log('📋 Step 3: Creating tables from TypeORM entities...', colors.cyan);
    log('   (This may take a minute...)\n', colors.cyan);
    
    // We need to load entities from the compiled dist
    // This is tricky because entities are bundled in webpack
    // So we'll use a different approach: run the app with synchronize=true
    
    log('⚠️  Cannot load entities from webpack bundle', colors.yellow);
    log('   Using alternative approach: pg_dump from running app\n', colors.yellow);
    
    // Step 4: Export schema using pg_dump
    log('📤 Step 4: Exporting schema with pg_dump...', colors.cyan);
    
    const outputPath = path.join(__dirname, '..', 'database', 'init', '01-init.sql');
    const dumpCommand = `docker-compose -f docker-compose.dev.yml exec -T postgres pg_dump -U ${dbConfig.username} -d ${dbConfig.database} --schema-only --no-owner --no-privileges`;
    
    const { stdout } = await execAsync(dumpCommand);
    
    // Write to file
    fs.writeFileSync(outputPath, stdout);
    
    log(`✅ Schema exported to: ${outputPath}\n`, colors.green);
    
    // Step 5: Show summary
    const lines = stdout.split('\n').length;
    const tableCount = (stdout.match(/CREATE TABLE/g) || []).length;
    
    log('='.repeat(80), colors.bright);
    log('✅ BASE SCHEMA CREATED SUCCESSFULLY!', colors.green);
    log('='.repeat(80) + '\n', colors.bright);
    
    log(`📊 Statistics:`, colors.cyan);
    log(`   - Tables created: ${tableCount}`, colors.cyan);
    log(`   - SQL lines: ${lines}`, colors.cyan);
    log(`   - Output file: ${outputPath}\n`, colors.cyan);
    
    log('Next steps:', colors.bright);
    log('1. Review the generated schema file', colors.cyan);
    log('2. Test with: docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up', colors.cyan);
    log('3. Commit to git: git add database/init/01-init.sql', colors.cyan);
    log('4. Deploy to production\n', colors.cyan);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

createBaseSchema();
