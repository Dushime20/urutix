#!/usr/bin/env node

/**
 * Professional Database Initialization Script
 * 
 * This script initializes a fresh database using TypeORM's synchronize feature
 * to auto-create all tables from the compiled entity definitions.
 * 
 * Features:
 * - Validates environment configuration
 * - Tests database connectivity
 * - Creates schema from entities
 * - Verifies table creation
 * - Provides detailed logging
 * - Handles errors gracefully
 * 
 * Usage: node init-database.js
 * 
 * Environment Variables Required:
 * - DB_HOST: Database host
 * - DB_PORT: Database port
 * - DB_USERNAME: Database username
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name
 */

require('dotenv').config();
const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Logging utilities
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message) {
  log('\n' + '='.repeat(80), colors.bright);
  log(message, colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  logInfo('Validating environment configuration...');
  
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    logInfo('Please ensure these are set in your .env file or environment');
    return false;
  }
  
  logSuccess('Environment configuration valid');
  logInfo(`Database: ${process.env.DB_NAME}`);
  logInfo(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  logInfo(`User: ${process.env.DB_USERNAME}`);
  
  return true;
}

/**
 * Check if compiled database config exists
 */
function validateCompiledConfig() {
  logInfo('Checking for compiled database configuration...');
  
  const configPath = path.join(__dirname, 'dist', 'config', 'database.config.js');
  
  if (!fs.existsSync(configPath)) {
    logError('Compiled database configuration not found!');
    logError(`Expected path: ${configPath}`);
    logInfo('Make sure the application has been built: npm run build');
    return false;
  }
  
  logSuccess('Compiled configuration found');
  return true;
}

/**
 * Test database connectivity
 */
async function testConnection() {
  logInfo('Testing database connectivity...');
  
  const { Client } = require('pg');
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  try {
    await client.connect();
    await client.query('SELECT NOW()');
    await client.end();
    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    logInfo('Please verify:');
    logInfo('  1. Database server is running');
    logInfo('  2. Credentials are correct');
    logInfo('  3. Database exists');
    logInfo('  4. Network connectivity');
    return false;
  }
}

/**
 * Check if database is empty
 */
async function checkDatabaseState(dataSource) {
  logInfo('Checking current database state...');
  
  try {
    const tables = await dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableCount = parseInt(tables[0].count);
    
    if (tableCount > 0) {
      logWarning(`Database already contains ${tableCount} tables`);
      logWarning('This script is designed for fresh database initialization');
      logInfo('Existing tables will be synchronized with entity definitions');
      return { isEmpty: false, tableCount };
    }
    
    logInfo('Database is empty - ready for initialization');
    return { isEmpty: true, tableCount: 0 };
  } catch (error) {
    logWarning(`Could not check database state: ${error.message}`);
    return { isEmpty: true, tableCount: 0 };
  }
}

/**
 * Initialize database schema
 */
async function initializeSchema() {
  logHeader('DATABASE SCHEMA INITIALIZATION');
  
  try {
    // Load compiled database configuration
    logInfo('Loading database configuration...');
    const { databaseConfig } = require('./dist/config/database.config');
    
    if (!databaseConfig || !databaseConfig.entities) {
      throw new Error('Invalid database configuration - entities not found');
    }
    
    logSuccess(`Loaded configuration with ${databaseConfig.entities.length} entities`);
    
    // Create DataSource with synchronize enabled
    logInfo('Creating TypeORM DataSource...');
    const AppDataSource = new DataSource({
      ...databaseConfig,
      synchronize: true, // Enable automatic schema synchronization
      logging: ['error', 'warn', 'schema'], // Log schema changes
      dropSchema: false, // Never drop existing schema
    });
    
    // Initialize connection
    logInfo('Initializing database connection...');
    await AppDataSource.initialize();
    logSuccess('Database connection established');
    
    // Check current state
    const state = await checkDatabaseState(AppDataSource);
    
    // Synchronize schema
    logInfo('Synchronizing database schema with entity definitions...');
    logInfo('This process will:');
    logInfo('  - Create missing tables');
    logInfo('  - Add missing columns');
    logInfo('  - Create indexes and constraints');
    logInfo('  - Preserve existing data');
    log('');
    
    // Wait for synchronization to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    logSuccess('Schema synchronization complete');
    
    // Verify tables were created
    logInfo('Verifying table creation...');
    const tables = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    if (tables.length === 0) {
      throw new Error('No tables were created - synchronization may have failed');
    }
    
    logSuccess(`Successfully created/verified ${tables.length} tables`);
    
    // Display table list
    log('\n' + '-'.repeat(80), colors.cyan);
    log('CREATED TABLES', colors.cyan);
    log('-'.repeat(80), colors.cyan);
    
    const columns = 4;
    const rows = Math.ceil(tables.length / columns);
    
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        const index = i + j * rows;
        if (index < tables.length) {
          row.push(tables[index].tablename.padEnd(25));
        }
      }
      log(row.join(''), colors.cyan);
    }
    
    log('-'.repeat(80) + '\n', colors.cyan);
    
    // Close connection
    await AppDataSource.destroy();
    logSuccess('Database connection closed');
    
    return { success: true, tableCount: tables.length };
    
  } catch (error) {
    logError(`Schema initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  
  logHeader('URUTIX DATABASE INITIALIZATION');
  
  try {
    // Step 1: Validate environment
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // Step 2: Validate compiled config
    if (!validateCompiledConfig()) {
      process.exit(1);
    }
    
    // Step 3: Test database connection
    if (!await testConnection()) {
      process.exit(1);
    }
    
    // Step 4: Initialize schema
    const result = await initializeSchema();
    
    // Success summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logHeader('INITIALIZATION COMPLETE');
    
    logSuccess(`Database initialized successfully in ${duration}s`);
    logSuccess(`Created ${result.tableCount} tables`);
    
    log('\n' + '='.repeat(80), colors.green);
    log('NEXT STEPS', colors.green);
    log('='.repeat(80) + '\n', colors.green);
    
    logInfo('1. Seed initial data:');
    log('   npm run seed:admin', colors.cyan);
    log('');
    logInfo('2. Start the application:');
    log('   npm run start:prod', colors.cyan);
    log('');
    logInfo('3. Verify health:');
    log('   curl http://localhost:3005/api/health', colors.cyan);
    log('');
    
    process.exit(0);
    
  } catch (error) {
    logHeader('INITIALIZATION FAILED');
    
    logError('Database initialization encountered an error');
    logError(`Error: ${error.message}`);
    
    if (error.stack) {
      log('\nStack trace:', colors.red);
      console.error(error.stack);
    }
    
    log('\n' + '='.repeat(80), colors.yellow);
    log('TROUBLESHOOTING', colors.yellow);
    log('='.repeat(80) + '\n', colors.yellow);
    
    logInfo('Common issues:');
    logInfo('  1. Database not running: docker-compose ps');
    logInfo('  2. Wrong credentials: check .env file');
    logInfo('  3. App not built: npm run build');
    logInfo('  4. Network issues: check database host/port');
    log('');
    
    process.exit(1);
  }
}

// Execute main function
main();
