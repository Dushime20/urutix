/**
 * Test the permission controller endpoint directly
 * This simulates what happens when the API is called
 */

const axios = require('axios');

async function testPermissionEndpoint() {
    console.log('🔍 Testing /api/admin/permissions/roles endpoint...\n');

    try {
        // First, let's check if the backend is running
        console.log('📋 Checking if backend is running...');
        
        try {
            const healthCheck = await axios.get('http://localhost:3000/health', { timeout: 2000 });
            console.log('✅ Backend is running\n');
        } catch (error) {
            console.log('❌ Backend is not running or not responding');
            console.log('   Please start the backend with: npm run start:dev\n');
            return;
        }

        // Try to get roles without authentication first to see the error
        console.log('📋 Testing GET /api/admin/permissions/roles (without auth)...');
        try {
            const response = await axios.get('http://localhost:3000/api/admin/permissions/roles');
            console.log('✅ Response received:');
            console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
            if (error.response) {
                console.log(`❌ Error ${error.response.status}: ${error.response.statusText}`);
                console.log('Response data:', JSON.stringify(error.response.data, null, 2));
                
                if (error.response.status === 401) {
                    console.log('\n💡 This is expected - endpoint requires authentication');
                    console.log('   The 500 error you\'re seeing might be from a different issue');
                } else if (error.response.status === 500) {
                    console.log('\n❌ 500 Internal Server Error detected!');
                    console.log('   Error details:', error.response.data);
                    
                    if (error.response.data.message) {
                        console.log('\n   Error message:', error.response.data.message);
                    }
                    
                    if (error.response.data.stack) {
                        console.log('\n   Stack trace:');
                        console.log(error.response.data.stack);
                    }
                }
            } else {
                console.log('❌ Network error:', error.message);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('TROUBLESHOOTING STEPS:');
        console.log('═══════════════════════════════════════════════════════');
        console.log('1. Check backend logs for detailed error messages');
        console.log('2. Restart the backend server: npm run start:dev');
        console.log('3. Check if the changes were compiled (TypeScript)');
        console.log('4. Verify the permission.service.ts file was saved');
        console.log('5. Check backend console for compilation errors');
        console.log('');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

testPermissionEndpoint().catch(console.error);
