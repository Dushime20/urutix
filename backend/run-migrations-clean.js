/**
 * Clean Migration Runner
 * 
 * This script runs all migrations from scratch in the correct order.
 * It handles the two migration directories properly:
 * 1. src/migrations/*.ts (main migrations)
 * 2. src/database/migrations/*.ts (feature migrations)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('='.repeat(60));
console.log('CLEAN MIGRATION RUNNER');
console.log('='.repeat(60));
console.log('\nThis will run ALL migrations in the correct order.\n');

try {
  console.log('Step 1: Running TypeORM migrations...\n');
  
  // Run migrations using TypeORM CLI
  // This will automatically:
  // - Create the migrations table
  // - Run all migrations in timestamp order
  // - Handle both migration directories (src/migrations and src/database/migrations)
  
  const result = execSync('npm run migration:run', {
    cwd: __dirname,
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('\nYou can now start the backend with: npm run start:dev\n');
  
} catch (error) {
  console.error('\n' + '='.repeat(60));
  console.error('✗ MIGRATION FAILED');
  console.error('='.repeat(60));
  console.error('\nError details:', error.message);
  console.error('\nPlease check the error above and fix any issues.\n');
  process.exit(1);
}
