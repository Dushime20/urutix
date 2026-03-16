/**
 * Debug JWT Token
 * Check what's in the JWT token and verify permissions
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugJwtToken() {
    console.log('🔍 Debugging JWT token and permissions...\n');

    try {
        // Login and get token
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@urutix.com',
            password: 'Admin@123'
        });

        console.log('✅ Login successful');
        console.log('📋 Login response data:');
        console.log(JSON.stringify(loginResponse.data, null, 2));

        const token = loginResponse.data.accessToken;
        console.log(`🎫 Token: ${token ? token.substring(0, 50) + '...' : 'No token found'}`);

        // Decode token to see contents
        console.log('\n2️⃣ Decoding JWT token...');
        const decoded = jwt.decode(token);
        console.log('📋 Token contents:');
        console.log(JSON.stringify(decoded, null, 2));

        // Test a simple endpoint first
        console.log('\n3️⃣ Testing simple endpoint...');
        try {
            const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Profile endpoint works');
            console.log(`👤 User: ${profileResponse.data.email} (${profileResponse.data.role})`);
        } catch (error) {
            console.log('❌ Profile endpoint failed:', error.response?.data || error.message);
        }

        // Test tenant management endpoint with more details
        console.log('\n4️⃣ Testing tenant management endpoint with detailed error...');
        try {
            const tenantResponse = await axios.get('http://localhost:3001/api/admin/tenant-management', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Tenant management endpoint works!');
            console.log(`📊 Found ${tenantResponse.data.length} tenants`);
        } catch (error) {
            console.log('❌ Tenant management endpoint failed');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Data:`, error.response?.data);
            console.log(`   Headers:`, error.response?.headers);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugJwtToken();