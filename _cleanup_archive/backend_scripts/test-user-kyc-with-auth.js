/**
 * Test User KYC Endpoints with Authentication
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'Admin@123';

async function testUserKycWithAuth() {
    console.log('🧪 Testing User KYC Endpoints with Authentication...\n');

    let accessToken = null;

    try {
        // Step 1: Login to get access token
        console.log('1️⃣ Logging in to get access token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            rememberMe: false
        });

        accessToken = loginResponse.data.accessToken;
        console.log('✅ Login successful, token obtained');
        console.log('User role:', loginResponse.data.user.role);
        console.log('User ID:', loginResponse.data.user.id);

    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return;
    }

    // Step 2: Test KYC requirements endpoint
    try {
        console.log('\n2️⃣ Testing KYC requirements endpoint...');
        const requirementsResponse = await axios.get(`${API_BASE_URL}/user-kyc/requirements/TENANT_ADMIN`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ KYC requirements endpoint successful');
        console.log('Requirements:', JSON.stringify(requirementsResponse.data, null, 2));
    } catch (error) {
        console.error('❌ KYC requirements endpoint failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
    }

    // Step 3: Test my-kyc endpoint
    try {
        console.log('\n3️⃣ Testing my-kyc endpoint...');
        const myKycResponse = await axios.get(`${API_BASE_URL}/user-kyc/my-kyc`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ My KYC endpoint successful');
        console.log('My KYC:', JSON.stringify(myKycResponse.data, null, 2));
    } catch (error) {
        console.error('❌ My KYC endpoint failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
    }

    // Step 4: Test other KYC endpoints
    const endpoints = [
        '/user-kyc/status',
        '/user-kyc/documents',
        '/user-kyc/requirements/SUPER_ADMIN'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n4️⃣ Testing ${endpoint}...`);
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ ${endpoint} successful`);
        } catch (error) {
            console.error(`❌ ${endpoint} failed:`, error.response?.status, error.response?.data?.message || error.message);
        }
    }
}

testUserKycWithAuth();