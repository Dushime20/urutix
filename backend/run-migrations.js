#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs TypeORM migrations in both development and production environments.
 * It handles the data source initialization and migration execution.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting migration process...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database:', process.env.DB_NAME || 'urutix');
console.log('Host:', process.env.DB_HOST || 'localhost');

try {
  // Run migrations using ts-node
  console.log('\n📦 Running migrations...\n');
  
  execSync(
    'ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/data-source.ts',
    {
      stdio: 'inherit',
      cwd: __dirname,
      env: process.env
    }
  );

  console.log('\n✅ Migrations completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
