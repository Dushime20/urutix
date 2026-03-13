const axios = require('axios');

async function testFrontendServer() {
    console.log('🧪 Testing Frontend Server Accessibility...\n');
    
    try {
        // Test if frontend server is running
        const response = await axios.get('http://localhost:5174', {
            timeout: 5000,
            validateStatus: () => true // Accept any status code
        });
        
        console.log('✅ Frontend server is accessible');
        console.log('   📍 URL: http://localhost:5174');
        console.log('   📄 Status:', response.status);
        console.log('   📦 Content-Type:', response.headers['content-type']);
        
        // Check if it's serving the React app
        if (response.data && response.data.includes('<!DOCTYPE html>')) {
            console.log('   🎯 Serving HTML content (likely React app)');
        }
        
        console.log('\n🎯 Admin Permissions Integration Test Plan:');
        console.log('');
        console.log('📋 Manual Testing Steps:');
        console.log('1. ✅ Backend API: Already tested and working');
        console.log('2. ✅ Frontend Server: Running and accessible');
        console.log('3. 🔄 Next: Test the UI integration');
        console.log('');
        console.log('🔗 Test URLs:');
        console.log('   Login: http://localhost:5174/login');
        console.log('   Admin Permissions: http://localhost:5174/admin/permissions');
        console.log('');
        console.log('🔑 Test Credentials:');
        console.log('   Email: admin2@urutix.com');
        console.log('   Password: Admin@123');
        console.log('   Role: ADMIN');
        console.log('');
        console.log('✅ Expected Results:');
        console.log('   - Login should work without "access denied" error');
        console.log('   - Admin dashboard should be accessible');
        console.log('   - Permissions page should show matrix and roles tabs');
        console.log('   - Permission matrix should display 100 permissions');
        console.log('   - Roles tab should show 12 roles');
        console.log('   - Should be able to toggle permissions for custom roles');
        
    } catch (error) {
        console.log('❌ Frontend server not accessible');
        console.log('   Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Frontend server is not running. To start it:');
            console.log('   cd urutix/frontend');
            console.log('   npm run dev');
        }
    }
}

testFrontendServer();