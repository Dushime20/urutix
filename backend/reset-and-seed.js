const { execSync } = require('child_process');

console.log('🔄 Resetting and seeding database...\n');

try {
  console.log('Step 1: Resetting database...');
  execSync('node reset-database.js', { stdio: 'inherit' });
  
  console.log('\nStep 2: Seeding database...');
  execSync('node seed-database.js', { stdio: 'inherit' });
  
  console.log('\n✅ All done! Database is ready for testing.');
} catch (error) {
  console.error('\n❌ Error during reset and seed:', error.message);
  process.exit(1);
}
