const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running KYC System Migration...');

try {
  // Check if migration file exists
  const migrationPath = path.join(__dirname, 'migrations', '019_tenant_kyc_system.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  console.log('📄 Found migration file:', migrationPath);

  // Read the migration file
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📖 Migration file loaded successfully');

  // Execute the migration using psql
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/urutix';
  
  console.log('🔗 Connecting to database...');
  console.log('📊 Executing KYC migration...');

  // Write migration to temp file for execution
  const tempFile = path.join(__dirname, 'temp_kyc_migration.sql');
  fs.writeFileSync(tempFile, migrationSQL);

  try {
    // Execute migration
    execSync(`psql "${dbUrl}" -f "${tempFile}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    console.log('✅ KYC migration executed successfully!');
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
  } catch (error) {
    console.error('❌ Migration execution failed:', error.message);
    
    // Clean up temp file even on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    process.exit(1);
  }

  console.log('🎉 KYC System Migration Complete!');
  console.log('');
  console.log('📋 What was added:');
  console.log('   ✓ KYC status and data fields to tenants table');
  console.log('   ✓ Onboarding step tracking');
  console.log('   ✓ KYC documents table for file management');
  console.log('   ✓ KYC audit log table for tracking changes');
  console.log('   ✓ Proper indexes for efficient querying');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   1. Restart your backend server');
  console.log('   2. Test KYC submission and approval workflow');
  console.log('   3. Verify admin KYC management interface');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}