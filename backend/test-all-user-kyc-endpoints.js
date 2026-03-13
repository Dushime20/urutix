/**
 * Comprehensive Test of All User KYC Endpoints
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'Admin@123';

async function testAllUserKycEndpoints() {
    console.log('🧪 Testing All User KYC Endpoints...\n');

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
        console.log('✅ Login successful');
        console.log('User role:', loginResponse.data.user.role);

    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return;
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // Test all GET endpoints
    const getEndpoints = [
        '/user-kyc/my-kyc',
        '/user-kyc/documents',
        '/user-kyc/requirements/SUPER_ADMIN',
        '/user-kyc/requirements/TENANT_ADMIN',
        '/user-kyc/requirements/TRUCK_OWNER',
        '/user-kyc/requirements/CARGO_OWNER',
        '/user-kyc/requirements/BROKER',
        '/user-kyc/requirements/DRIVER',
        '/user-kyc/requirements/AGENT',
        '/user-kyc/requirements/LENDER'
    ];

    console.log('\n📋 Testing GET endpoints...');
    for (const endpoint of getEndpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers });
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
        } catch (error) {
            console.error(`❌ ${endpoint} - Status: ${error.response?.status}, Error: ${error.response?.data?.message || error.message}`);
        }
    }

    // Test document upload endpoint (POST)
    console.log('\n📄 Testing document upload endpoint...');
    try {
        const uploadData = {
            documentType: 'IDENTITY_DOCUMENT',
            documentCategory: 'IDENTITY',
            documentName: 'Test ID Document',
            filePath: '/uploads/test-id.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            notes: 'Test document upload'
        };

        const uploadResponse = await axios.post(`${API_BASE_URL}/user-kyc/documents`, uploadData, { headers });
        console.log('✅ Document upload successful - Status:', uploadResponse.status);
        console.log('Document ID:', uploadResponse.data.data?.id);
        
        // Store document ID for further tests
        const documentId = uploadResponse.data.data?.id;

        // Test document verification (if document was created)
        if (documentId) {
            console.log('\n🔍 Testing document verification...');
            try {
                const verifyResponse = await axios.put(`${API_BASE_URL}/user-kyc/documents/${documentId}/verify`, {
                    verified: true,
                    notes: 'Test verification'
                }, { headers });
                console.log('✅ Document verification successful - Status:', verifyResponse.status);
            } catch (error) {
                console.error('❌ Document verification failed:', error.response?.status, error.response?.data?.message);
            }
        }

    } catch (error) {
        console.error('❌ Document upload failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test KYC status update
    console.log('\n📊 Testing KYC status update...');
    try {
        const statusUpdateData = {
            kycStatus: 'UNDER_REVIEW',
            notes: 'Test status update'
        };

        const statusResponse = await axios.patch(`${API_BASE_URL}/user-kyc/status`, statusUpdateData, { headers });
        console.log('✅ KYC status update successful - Status:', statusResponse.status);
    } catch (error) {
        console.error('❌ KYC status update failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test audit log retrieval
    console.log('\n📜 Testing audit log retrieval...');
    try {
        const auditResponse = await axios.get(`${API_BASE_URL}/user-kyc/audit-log`, { headers });
        console.log('✅ Audit log retrieval successful - Status:', auditResponse.status);
        console.log('Audit entries count:', auditResponse.data.data?.length || 0);
    } catch (error) {
        console.error('❌ Audit log retrieval failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 User KYC endpoint testing completed!');
}

testAllUserKycEndpoints();