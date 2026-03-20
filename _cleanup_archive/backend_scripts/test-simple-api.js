/**
 * Simple API test
 */

const axios = require('axios');

async function testSimpleApi() {
    console.log('🔍 Testing simple API endpoints...\n');

    try {
        // Test basic health check or any GET endpoint
        console.log('1️⃣ Testing basic API connection...');
        const healthResponse = await axios.get('http://localhost:3001/');
        console.log('✅ Root endpoint response:', healthResponse.status);
    } catch (error) {
        console.log('❌ Root endpoint failed:', error.message);
    }

    try {
        // Test auth endpoint structure
        console.log('\n2️⃣ Testing auth endpoint...');
        const authResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'test@example.com',
            password: 'test'
        });
        console.log('✅ Auth endpoint response:', authResponse.status);
    } catch (error) {
        console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data || error.message);
    }

    try {
        // Test with correct credentials
        console.log('\n3️⃣ Testing with admin credentials...');
        const adminResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'superadmin@urutix.com',
            password: 'Admin@123'
        });
        console.log('✅ Admin login response:', adminResponse.status);
        if (adminResponse.data.access_token) {
            console.log('✅ Access token received');
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.response?.status, error.response?.data || error.message);
    }
}

testSimpleApi();