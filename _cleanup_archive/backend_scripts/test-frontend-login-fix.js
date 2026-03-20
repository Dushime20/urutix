/**
 * Test Frontend Login Fix
 * Test if the frontend can now successfully login after fixing the port mismatches
 */

const axios = require('axios');

async function testFrontendLoginFix() {
    console.log('🔧 Testing frontend login fix...\n');

    try {
        // Test the login endpoint that the frontend should be using
        console.log('1️⃣ Testing backend login endpoint...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@urutix.com',
            password: 'Admin@123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5174' // Frontend origin
            }
        });

        console.log('✅ Backend login successful');
        console.log(`   Status: ${loginResponse.status}`);
        console.log(`   Has token: ${!!loginResponse.data.accessToken}`);
        console.log(`   User: ${loginResponse.data.user?.email} (${loginResponse.data.user?.role})`);

        const token = loginResponse.data.accessToken;

        // Test an authenticated endpoint
        console.log('\n2️⃣ Testing authenticated endpoint...');
        const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });

        console.log('✅ Profile endpoint successful');
        console.log(`   Status: ${profileResponse.status}`);
        console.log(`   User: ${profileResponse.data.data?.user?.email}`);

        // Test tenant management endpoint
        console.log('\n3️⃣ Testing tenant management endpoint...');
        const tenantResponse = await axios.get('http://localhost:3001/api/admin/tenant-management', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });

        console.log('✅ Tenant management endpoint successful');
        console.log(`   Status: ${tenantResponse.status}`);
        console.log(`   Tenants found: ${tenantResponse.data.length}`);

        console.log('\n🎉 All tests passed! Frontend should now be able to login successfully.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error(`   Status: ${error.response.status}`);
        }
    }
}

testFrontendLoginFix();