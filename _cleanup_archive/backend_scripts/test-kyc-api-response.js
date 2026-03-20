/**
 * Test KYC API Response for deborahrutagengwa.admin@urutix.com
 */

const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function testKycApiResponse() {
    console.log('🔍 Testing KYC API response for deborahrutagengwa.admin@urutix.com...\n');

    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Database connected');

        // Step 1: Get user data directly from database
        console.log('\n1️⃣ Getting user data from database...');
        const userResult = await client.query(`
            SELECT 
                u.id as user_id, u.email, u.role,
                up.id as profile_id, up."kycStatus", up.compliance_score,
                up.identity_verified, up.address_verified, up.business_verified,
                up.kyc_data, up."kycVerifiedAt", up.kyc_requirement_level
            FROM users u
            LEFT JOIN user_profiles up ON up."userId" = u.id
            WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const userData = userResult.rows[0];
        console.log('📊 Database Data:');
        console.log(`   User ID: ${userData.user_id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   KYC Status: ${userData.kycStatus}`);
        console.log(`   Compliance Score: ${userData.compliance_score}`);
        console.log(`   Identity Verified: ${userData.identity_verified}`);
        console.log(`   Address Verified: ${userData.address_verified}`);
        console.log(`   Business Verified: ${userData.business_verified}`);
        console.log(`   KYC Verified At: ${userData.kycVerifiedAt}`);
        console.log(`   Requirement Level: ${userData.kyc_requirement_level}`);

        // Step 2: Get documents from database
        console.log('\n2️⃣ Getting documents from database...');
        const documentsResult = await client.query(`
            SELECT document_type, document_category, document_name, verified
            FROM user_kyc_documents 
            WHERE user_id = $1
            ORDER BY created_at
        `, [userData.user_id]);

        console.log(`📄 Documents (${documentsResult.rows.length}):`);
        documentsResult.rows.forEach(doc => {
            console.log(`   - ${doc.document_name} (${doc.document_type}/${doc.document_category}) - Verified: ${doc.verified}`);
        });

        // Step 3: Get KYC requirements
        console.log('\n3️⃣ Getting KYC requirements...');
        const requirementsResult = await client.query(`
            SELECT role, requirement_level, required_documents, optional_documents
            FROM kyc_role_requirements 
            WHERE role = $1
        `, [userData.role]);

        if (requirementsResult.rows.length > 0) {
            const req = requirementsResult.rows[0];
            console.log('📋 Requirements:');
            console.log(`   Role: ${req.role}`);
            console.log(`   Level: ${req.requirement_level}`);
            console.log(`   Required Docs: ${JSON.stringify(req.required_documents)}`);
            console.log(`   Optional Docs: ${JSON.stringify(req.optional_documents)}`);
        }

        // Step 4: Test API endpoint (if backend is running)
        console.log('\n4️⃣ Testing API endpoint...');
        try {
            // First, try to login to get a token
            const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'deborahrutagengwa.admin@urutix.com',
                password: 'Admin@123'
            });

            if (loginResponse.data.accessToken) {
                console.log('✅ Login successful');
                
                // Now test the KYC endpoint
                const kycResponse = await axios.get('http://localhost:3001/api/user-kyc/my-kyc', {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.accessToken}`
                    }
                });

                console.log('✅ KYC API Response:');
                console.log('📊 API Data Summary:');
                
                const apiData = kycResponse.data.data; // Note the nested structure
                
                if (apiData.profile) {
                    console.log(`   KYC Status: ${apiData.profile.kycStatus}`);
                    console.log(`   Compliance Score: ${apiData.profile.complianceScore}`);
                    console.log(`   Identity Verified: ${apiData.profile.identityVerified}`);
                    console.log(`   Address Verified: ${apiData.profile.addressVerified}`);
                    console.log(`   Business Verified: ${apiData.profile.businessVerified}`);
                    console.log(`   KYC Verified At: ${apiData.profile.kycVerifiedAt}`);
                } else {
                    console.log('❌ No profile data in API response');
                }

                if (apiData.documents) {
                    console.log(`📄 API Documents (${apiData.documents.length}):`);
                    apiData.documents.forEach(doc => {
                        console.log(`   - ${doc.documentName} (${doc.documentType}/${doc.documentCategory}) - Verified: ${doc.verified}`);
                    });
                }

                if (apiData.requirements) {
                    console.log('📋 API Requirements:');
                    console.log(`   Required Docs: ${JSON.stringify(apiData.requirements.requiredDocuments)}`);
                }

                // Step 5: Compare database vs API data
                console.log('\n5️⃣ Data Comparison:');
                const dbStatus = userData.kycStatus;
                const apiStatus = apiData.profile?.kycStatus;
                
                if (dbStatus === apiStatus) {
                    console.log(`✅ KYC Status matches: ${dbStatus}`);
                } else {
                    console.log(`❌ KYC Status mismatch: DB=${dbStatus}, API=${apiStatus}`);
                }

                const dbScore = userData.compliance_score;
                const apiScore = apiData.profile?.complianceScore;
                
                if (dbScore === apiScore) {
                    console.log(`✅ Compliance Score matches: ${dbScore}`);
                } else {
                    console.log(`❌ Compliance Score mismatch: DB=${dbScore}, API=${apiScore}`);
                }

                if (apiData.documents) {
                    console.log(`📄 API Documents (${apiData.documents.length}):`);
                    apiData.documents.forEach(doc => {
                        console.log(`   - ${doc.documentName} (${doc.documentType}/${doc.documentCategory}) - Verified: ${doc.verified}`);
                    });
                }

                if (apiData.requirements) {
                    console.log('📋 API Requirements:');
                    console.log(`   Required Docs: ${JSON.stringify(apiData.requirements.requiredDocuments)}`);
                }

            } else {
                console.log('❌ Login failed - no access token received');
            }

        } catch (apiError) {
            console.log('❌ API test failed:', apiError.message);
            if (apiError.response) {
                console.log('   Status:', apiError.response.status);
                console.log('   Data:', apiError.response.data);
            }
            console.log('   This might be because the backend is not running or the credentials are incorrect');
        }

        await client.end();
        console.log('\n✅ Test complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

testKycApiResponse();