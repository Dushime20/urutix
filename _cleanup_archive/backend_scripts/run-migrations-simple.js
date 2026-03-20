const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running migrations in batches...\n');

// Get all migration files
const migrationDirs = [
  'src/database/migrations',
  'src/migrations'
];

const allMigrations = [];

migrationDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.ts'))
      .map(f => ({
        file: f,
        path: path.join(dir, f),
        timestamp: f.match(/\d+/)?.[0] || '0'
      }))
      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    
    allMigrations.push(...files);
  }
});

console.log(`Found ${allMigrations.length} migration file(s)\n`);

// Run migrations using npm script (which handles them all)
console.log('🔄 Running all migrations...\n');
console.log('='.repeat(60));

try {
  const output = execSync('npm run migration:run', { 
    encoding: 'utf8',
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ Migrations completed!');
} catch (error) {
  console.error('\n❌ Some migrations failed');
  console.error('Check the output above for details');
  process.exit(1);
}

