#!/usr/bin/env node

/**
 * Professional Database Initialization Script
 * 
 * This script initializes a fresh database by temporarily enabling
 * TypeORM's synchronize feature to auto-create all tables.
 * 
 * Works with webpack-bundled applications where entities are embedded
 * in the bundle rather than separate files.
 * 
 * Usage: node init-database.js
 */

require('dotenv').config();
const { DataSource } = require('typeorm');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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
 * Validate environment
 */
function validateEnvironment() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(`Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Load all entity classes from the bundled main.js
 * This extracts entity constructors from the webpack bundle
 */
function loadEntitiesFromBundle() {
  logInfo('Loading entities from application bundle...');
  
  try {
    // Load the main bundle
    const bundle = require('./dist/main.js');
    
    // Entity classes are exported in the bundle
    // We need to extract them by looking for TypeORM decorators
    const entities = [];
    
    // Common entity names based on your codebase
    const entityNames = [
      'User', 'UserProfile', 'Load', 'Location', 'Truck', 'Driver', 'Route', 'Trip',
      'Payment', 'Tenant', 'RefreshToken', 'PasswordResetToken', 'EmailVerificationToken',
      'Dispute', 'AuditLog', 'UserRating', 'UserReward', 'UserScore', 'Bid', 'Auction',
      'Lender', 'LenderPolicy', 'LoanRequest', 'LoanDisbursement', 'LoanRepayment',
      'LoanTerms', 'Borrower', 'RouteTruck', 'AuctionView', 'AuctionWatch',
      'SafetyIncident', 'SafetyInspection', 'SafetyTraining', 'CargoInspection',
      'BrokerCommission', 'LoadContract', 'InsuranceVerification', 'BrokerDispute',
      'EscrowAccount', 'LoadDocument', 'LoadMatch', 'FuelLog', 'MaintenanceLog',
      'Document', 'Notification', 'SystemSettings', 'SecurityEvent', 'UserSession',
      'ActivityLog', 'Alert', 'AuditEvent', 'SystemHealthLog', 'CreditAccount',
      'CreditPackage', 'CreditPricingRule', 'CreditTransaction', 'TenantSubscription',
      'SubscriptionPlan', 'SubscriptionPayment', 'CreditMarketplaceSettings',
      'FeatureCreditCost', 'Role', 'Permission', 'UserPermissionOverride',
      'FuelWallet', 'FuelWalletTransaction', 'FuelBudget', 'DriverFuelAdvance',
      'EmailTemplate', 'BulkEmailLog', 'LoadTemplate', 'Receipt', 'Epod',
      'NotificationPreference', 'NotificationLog', 'CargoOwnerAnalytics',
      'AnalyticsInsights', 'Message', 'InsurancePolicy', 'InsuranceClaim',
      'InsuranceRenewal', 'TenantKycDocument', 'TenantKycAuditLog',
      'UserKycDocument', 'UserKycAuditLog', 'KycRoleRequirements',
      'LendingPolicyInterestRate', 'LendingPolicyLoanLimit', 'LendingPolicyEligibility',
      'LendingPolicyRiskAssessment', 'LendingPolicyRepayment', 'LendingPolicyCargoType',
      'LendingPolicySystemConfig', 'LenderUser', 'LenderRole', 'LenderPermission',
      'PriceSuggestion', 'TrackingEvent',
    ];
    
    // Try to find entities in the bundle
    for (const name of entityNames) {
      if (bundle[name] && typeof bundle[name] === 'function') {
        entities.push(bundle[name]);
      }
    }
    
    if (entities.length > 0) {
      logSuccess(`Found ${entities.length} entity classes in bundle`);
      return entities;
    }
    
    logWarning('Could not extract entities from bundle');
    return null;
    
  } catch (error) {
    logWarning(`Could not load bundle: ${error.message}`);
    return null;
  }
}

/**
 * Initialize database using direct SQL approach
 * Since we can't easily extract entities from webpack bundle,
 * we'll use the running application's schema
 */
async function initializeDatabase() {
  logHeader('URUTIX DATABASE INITIALIZATION');
  
  const startTime = Date.now();
  
  try {
    // Validate environment
    logInfo('Validating environment...');
    if (!validateEnvironment()) {
      throw new Error('Environment validation failed');
    }
    
    logSuccess('Environment valid');
    logInfo(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Test connection
    logInfo('Testing database connection...');
    const { Client } = require('pg');
    const testClient = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    await testClient.connect();
    await testClient.query('SELECT NOW()');
    await testClient.end();
    logSuccess('Database connection successful');
    
    // Since entities are bundled, we need to start the app briefly with synchronize
    logInfo('Starting application with schema synchronization...');
    logWarning('This will temporarily start the application to sync schema');
    
    // Set synchronize flag
    process.env.TYPEORM_SYNCHRONIZE = 'true';
    
    // Import and bootstrap the application
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/main.js');
    
    logInfo('Bootstrapping NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    
    // Wait for TypeORM to synchronize
    logInfo('Waiting for schema synchronization...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get DataSource to verify
    const dataSource = app.get('DataSource');
    
    if (dataSource && dataSource.isInitialized) {
      // Check tables
      const tables = await dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      logSuccess(`Schema synchronized - ${tables.length} tables created`);
      
      // Display tables
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
    }
    
    // Close application
    await app.close();
    logSuccess('Application closed');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logHeader('INITIALIZATION COMPLETE');
    logSuccess(`Database initialized in ${duration}s`);
    
    log('\n' + '='.repeat(80), colors.green);
    log('NEXT STEPS', colors.green);
    log('='.repeat(80) + '\n', colors.green);
    
    logInfo('1. Seed admin user: npm run seed:admin');
    logInfo('2. Start application: npm run start:prod');
    log('');
    
    process.exit(0);
    
  } catch (error) {
    logHeader('INITIALIZATION FAILED');
    logError(`Error: ${error.message}`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    log('\n' + '='.repeat(80), colors.yellow);
    log('ALTERNATIVE APPROACH', colors.yellow);
    log('='.repeat(80) + '\n', colors.yellow);
    
    logInfo('Since the app uses webpack bundling, try this instead:');
    log('');
    log('1. Temporarily enable synchronize in database config:', colors.cyan);
    log('   Edit src/config/database.config.ts', colors.cyan);
    log('   Set: synchronize: true', colors.cyan);
    log('');
    log('2. Rebuild and start the app:', colors.cyan);
    log('   docker-compose build backend', colors.cyan);
    log('   docker-compose up -d backend', colors.cyan);
    log('');
    log('3. Wait 30 seconds for tables to be created', colors.cyan);
    log('');
    log('4. Stop the app and disable synchronize:', colors.cyan);
    log('   Set: synchronize: false', colors.cyan);
    log('   Rebuild and restart', colors.cyan);
    log('');
    
    process.exit(1);
  }
}

// Run
initializeDatabase();
