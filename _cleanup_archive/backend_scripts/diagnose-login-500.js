/**
 * Diagnose Login 500 Error
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'Admin@123';

async function diagnoseLogin() {
    console.log('🔍 Diagnosing Login 500 Error...\n');

    try {
        // First, test if the auth endpoint exists
        console.log('1. Testing auth endpoint availability...');
        const healthResponse = await axios.get(`${API_BASE_URL}/auth/rate-limit-info`);
        console.log('✅ Auth endpoint is accessible');
        console.log('Rate limit info:', healthResponse.data);
    } catch (error) {
        console.error('❌ Auth endpoint not accessible:', error.message);
        return;
    }

    try {
        // Test the diagnose endpoint first
        console.log('\n2. Testing diagnose endpoint...');
        const diagnoseResponse = await axios.post(`${API_BASE_URL}/auth/diagnose`, {
            email: TEST_EMAIL
        });
        console.log('✅ Diagnose endpoint works');
        console.log('Account diagnosis:', JSON.stringify(diagnoseResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Diagnose endpoint failed:', error.response?.data || error.message);
    }

    try {
        // Now test the actual login
        console.log('\n3. Testing login endpoint...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            rememberMe: false
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Login failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.message);
        console.error('Response:', JSON.stringify(error.response?.data, null, 2));
        
        // Additional debugging
        if (error.response?.status === 500) {
            console.log('\n🔍 500 Error Analysis:');
            console.log('- This indicates an internal server error');
            console.log('- Check backend logs for detailed error information');
            console.log('- Common causes: Database connection, missing environment variables, service dependencies');
        }
    }
}

diagnoseLogin();