const fs = require('fs');
const path = require('path');

console.log('🔍 Testing /tenant-admin/users route configuration...\n');

// Read the App.tsx file
const appTsxPath = path.join(__dirname, 'frontend/src/App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

// Check if the route is properly configured
const checks = [
    {
        name: 'TenantUserManagementPage import',
        pattern: /const TenantUserManagementPage = lazy\(\(\) => import\('\.\/pages\/tenant-admin\/TenantUserManagementPage'\)\);/,
        found: false
    },
    {
        name: '/tenant-admin/users route definition',
        pattern: /<Route path="users" element={<TenantUserManagementPage \/>} \/>/,
        found: false
    },
    {
        name: 'Tenant admin routes section',
        pattern: /{\/\* Tenant Admin Routes \*\/}/,
        found: false
    }
];

// Check each pattern
checks.forEach(check => {
    check.found = check.pattern.test(appTsxContent);
});

// Display results
console.log('📋 Route Configuration Check Results:');
console.log('=====================================');

checks.forEach(check => {
    const status = check.found ? '✅ FOUND' : '❌ MISSING';
    console.log(`${status} - ${check.name}`);
});

// Check if wrapper component exists
const wrapperPath = path.join(__dirname, 'frontend/src/pages/tenant-admin/TenantUserManagementPage.tsx');
const wrapperExists = fs.existsSync(wrapperPath);
console.log(`${wrapperExists ? '✅ FOUND' : '❌ MISSING'} - TenantUserManagementPage wrapper component`);

// Check if original component exists
const originalPath = path.join(__dirname, 'frontend/src/components/TenantDashboard/TenantUserManagement.tsx');
const originalExists = fs.existsSync(originalPath);
console.log(`${originalExists ? '✅ FOUND' : '❌ MISSING'} - TenantUserManagement original component`);

console.log('\n🎯 Summary:');
const allChecksPass = checks.every(check => check.found) && wrapperExists && originalExists;
if (allChecksPass) {
    console.log('✅ All checks passed! The /tenant-admin/users route should work correctly.');
    console.log('\n📝 Route Details:');
    console.log('   - URL: /tenant-admin/users');
    console.log('   - Component: TenantUserManagementPage (wrapper)');
    console.log('   - Renders: TenantUserManagement with tenantId from auth context');
    console.log('   - Layout: TenantAdminLayout');
} else {
    console.log('❌ Some checks failed. Please review the configuration.');
}

console.log('\n🔧 Next Steps:');
console.log('1. Start the frontend development server');
console.log('2. Navigate to /tenant-admin/users');
console.log('3. Verify the user management interface loads correctly');
console.log('4. Test user onboarding and management features');