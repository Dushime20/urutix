/**
 * Test API Login Endpoint
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'Admin@123';

async function testApiLogin() {
    console.log('🌐 Testing API Login Endpoint...\n');
    console.log(`API URL: ${API_BASE_URL}/auth/login`);
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}\n`);

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            rememberMe: false
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Login API successful!');
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));

        if (response.data.accessToken) {
            console.log('\n🎉 Access token received - login is working!');
        }

    } catch (error) {
        console.error('❌ Login API failed!');
        console.error(`Status: ${error.response?.status || 'No response'}`);
        console.error(`Error: ${error.message}`);
        
        if (error.response?.data) {
            console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
        }

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Backend server is not running!');
            console.error('   Start it with: npm run start:dev');
        }
    }
}

testApiLogin();