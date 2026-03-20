/**
 * Test Frontend-Backend Connection
 * Test if the frontend can connect to the backend API
 */

const axios = require('axios');

async function testFrontendBackendConnection() {
    console.log('🔗 Testing frontend-backend connection...\n');

    // Test different possible API endpoints
    const endpoints = [
        'http://localhost:3001/api/auth/login',
        'http://localhost:3000/api/auth/login',
        'http://localhost:3002/api/auth/login',
        'http://localhost:3005/api/auth/login'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`🧪 Testing: ${endpoint}`);
            
            // Test with valid credentials
            const response = await axios.post(endpoint, {
                email: 'admin@urutix.com',
                password: 'Admin@123'
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ SUCCESS: ${endpoint}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Has token: ${!!response.data.accessToken}`);
            console.log(`   User: ${response.data.user?.email} (${response.data.user?.role})`);
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ FAILED: ${endpoint} - Connection refused (server not running)`);
            } else if (error.response) {
                console.log(`❌ FAILED: ${endpoint} - Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log(`❌ FAILED: ${endpoint} - Timeout`);
            } else {
                console.log(`❌ FAILED: ${endpoint} - ${error.message}`);
            }
        }
        console.log('');
    }

    // Test CORS preflight
    console.log('🔍 Testing CORS preflight...');
    try {
        const response = await axios.options('http://localhost:3001/api/auth/login', {
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('✅ CORS preflight successful');
        console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
        console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods']}`);
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
    }
}

testFrontendBackendConnection();