const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying User KYC System Implementation...\n');

// Files to check
const requiredFiles = [
  // Migration
  'migrations/020_user_kyc_system_enhancement.sql',
  
  // Entities
  'src/entities/user-kyc-document.entity.ts',
  'src/entities/kyc-role-requirements.entity.ts', 
  'src/entities/user-kyc-audit-log.entity.ts',
  
  // Services
  'src/services/user-kyc.service.ts',
  
  // Controllers & Modules
  'src/modules/user-kyc/user-kyc.controller.ts',
  'src/modules/user-kyc/user-kyc.module.ts',
  
  // Scripts
  'run-user-kyc-migration.js',
  'test-user-kyc-system.js',
];

const frontendFiles = [
  // Components
  '../frontend/src/components/UserKYC/UserKycForm.tsx',
  '../frontend/src/components/UserKYC/UserKycDashboard.tsx',
  '../frontend/src/components/UserKYC/DocumentUpload.tsx',
  '../frontend/src/components/UserKYC/AdminKycManagement.tsx',
  
  // Services
  '../frontend/src/services/userKycApi.ts',
];

let allFilesExist = true;

console.log('📁 Backend Files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📁 Frontend Files:');
frontendFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check if UserKyc module is added to app.module.ts
console.log('\n🔧 Module Integration:');
const appModulePath = path.join(__dirname, 'src/app.module.ts');
if (fs.existsSync(appModulePath)) {
  const appModuleContent = fs.readFileSync(appModulePath, 'utf8');
  const hasImport = appModuleContent.includes('UserKycModule');
  const hasInImports = appModuleContent.includes('UserKycModule,');
  
  console.log(`${hasImport ? '✅' : '❌'} UserKycModule import statement`);
  console.log(`${hasInImports ? '✅' : '❌'} UserKycModule in imports array`);
  
  if (!hasImport || !hasInImports) allFilesExist = false;
} else {
  console.log('❌ app.module.ts not found');
  allFilesExist = false;
}

// Check migration file content
console.log('\n📊 Migration Content:');
const migrationPath = path.join(__dirname, 'migrations/020_user_kyc_system_enhancement.sql');
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  const hasUserKycDocuments = migrationContent.includes('CREATE TABLE IF NOT EXISTS user_kyc_documents');
  const hasAuditLog = migrationContent.includes('CREATE TABLE IF NOT EXISTS user_kyc_audit_log');
  const hasRoleRequirements = migrationContent.includes('CREATE TABLE IF NOT EXISTS kyc_role_requirements');
  const hasUserProfileUpdates = migrationContent.includes('ALTER TABLE user_profiles');
  const hasKycRequirementsSeeding = migrationContent.includes('INSERT INTO kyc_role_requirements');
  
  console.log(`${hasUserKycDocuments ? '✅' : '❌'} user_kyc_documents table creation`);
  console.log(`${hasAuditLog ? '✅' : '❌'} user_kyc_audit_log table creation`);
  console.log(`${hasRoleRequirements ? '✅' : '❌'} kyc_role_requirements table creation`);
  console.log(`${hasUserProfileUpdates ? '✅' : '❌'} user_profiles table updates`);
  console.log(`${hasKycRequirementsSeeding ? '✅' : '❌'} KYC requirements seeding`);
  
  if (!hasUserKycDocuments || !hasAuditLog || !hasRoleRequirements || !hasUserProfileUpdates || !hasKycRequirementsSeeding) {
    allFilesExist = false;
  }
} else {
  console.log('❌ Migration file not found');
  allFilesExist = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 All User KYC System files are properly implemented!');
  console.log('\n📋 Next Steps:');
  console.log('1. Ensure PostgreSQL database is running');
  console.log('2. Run: node run-user-kyc-migration.js');
  console.log('3. Restart backend server: npm run start:dev');
  console.log('4. Test system: node test-user-kyc-system.js');
} else {
  console.log('❌ Some files are missing or incomplete.');
  console.log('Please check the implementation and ensure all files are created.');
}

console.log('\n📖 Documentation:');
console.log('- Implementation Guide: USER_KYC_SYSTEM_IMPLEMENTATION_COMPLETE.md');
console.log('- Deployment Guide: USER_KYC_DEPLOYMENT_GUIDE.md');