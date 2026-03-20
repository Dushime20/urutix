/**
 * Debug KYC Issue for deborahrutagengwa.admin@urutix.com
 */

const { Client } = require('pg');
require('dotenv').config();

async function debugDeborahKycIssue() {
    console.log('🔍 Debugging KYC issue for deborahrutagengwa.admin@urutix.com...\n');

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

        // Step 1: Find the user
        console.log('\n1️⃣ Finding user deborahrutagengwa.admin@urutix.com...');
        const userResult = await client.query(`
            SELECT id, email, role, status, "createdAt", "updatedAt"
            FROM users 
            WHERE email = 'deborahrutagengwa.admin@urutix.com'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);

        // Step 2: Check user profile
        console.log('\n2️⃣ Checking user profile...');
        const profileResult = await client.query(`
            SELECT 
                id, "userId", "tenantId", "firstName", "lastName", "companyName",
                "kycStatus", kyc_submitted_at, "kycVerifiedAt", kyc_requirement_level,
                identity_verified, address_verified, financial_verified, business_verified,
                background_check_completed, compliance_score, kyc_notes,
                "createdAt", "updatedAt"
            FROM user_profiles 
            WHERE "userId" = $1
        `, [user.id]);

        if (profileResult.rows.length === 0) {
            console.log('❌ User profile not found!');
            return;
        }

        const profile = profileResult.rows[0];
        console.log('✅ User profile found:');
        console.log(`   Profile ID: ${profile.id}`);
        console.log(`   Name: ${profile.firstName} ${profile.lastName}`);
        console.log(`   Company: ${profile.companyName || 'N/A'}`);
        console.log(`   KYC Status: ${profile.kycStatus || 'NULL'}`);
        console.log(`   KYC Submitted: ${profile.kyc_submitted_at || 'NULL'}`);
        console.log(`   KYC Verified: ${profile.kycVerifiedAt || 'NULL'}`);
        console.log(`   Requirement Level: ${profile.kyc_requirement_level || 'NULL'}`);
        console.log(`   Identity Verified: ${profile.identity_verified}`);
        console.log(`   Address Verified: ${profile.address_verified}`);
        console.log(`   Financial Verified: ${profile.financial_verified}`);
        console.log(`   Business Verified: ${profile.business_verified}`);
        console.log(`   Background Check: ${profile.background_check_completed}`);
        console.log(`   Compliance Score: ${profile.compliance_score}`);
        console.log(`   KYC Notes: ${profile.kyc_notes || 'NULL'}`);

        // Step 3: Check KYC documents
        console.log('\n3️⃣ Checking KYC documents...');
        const documentsResult = await client.query(`
            SELECT 
                id, document_type, document_category, document_name, 
                verified, verified_at, verified_by, expiry_date,
                created_at, updated_at
            FROM user_kyc_documents 
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [user.id]);

        console.log(`📄 Found ${documentsResult.rows.length} KYC documents:`);
        documentsResult.rows.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.document_name}`);
            console.log(`      Type: ${doc.document_type}`);
            console.log(`      Category: ${doc.document_category}`);
            console.log(`      Verified: ${doc.verified}`);
            console.log(`      Verified At: ${doc.verified_at || 'NULL'}`);
            console.log(`      Verified By: ${doc.verified_by || 'NULL'}`);
            console.log(`      Expiry: ${doc.expiry_date || 'NULL'}`);
            console.log(`      Created: ${doc.created_at}`);
            console.log('');
        });

        // Step 4: Check KYC audit log
        console.log('\n4️⃣ Checking KYC audit log...');
        const auditResult = await client.query(`
            SELECT 
                id, action, old_status, new_status, performed_by, notes,
                created_at
            FROM user_kyc_audit_log 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 10
        `, [user.id]);

        console.log(`📜 Found ${auditResult.rows.length} audit log entries:`);
        auditResult.rows.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.action}`);
            console.log(`      Old Status: ${log.old_status || 'NULL'}`);
            console.log(`      New Status: ${log.new_status || 'NULL'}`);
            console.log(`      Performed By: ${log.performed_by || 'NULL'}`);
            console.log(`      Notes: ${log.notes || 'NULL'}`);
            console.log(`      Created: ${log.created_at}`);
            console.log('');
        });

        // Step 5: Check KYC requirements for user role
        console.log('\n5️⃣ Checking KYC requirements for role...');
        const requirementsResult = await client.query(`
            SELECT 
                id, role, requirement_level, required_documents, 
                optional_documents, verification_steps, auto_approval_eligible,
                description
            FROM kyc_role_requirements 
            WHERE role = $1
        `, [user.role]);

        if (requirementsResult.rows.length > 0) {
            const req = requirementsResult.rows[0];
            console.log('✅ KYC requirements found:');
            console.log(`   Role: ${req.role}`);
            console.log(`   Level: ${req.requirement_level}`);
            console.log(`   Required Docs: ${JSON.stringify(req.required_documents)}`);
            console.log(`   Optional Docs: ${JSON.stringify(req.optional_documents)}`);
            console.log(`   Verification Steps: ${JSON.stringify(req.verification_steps)}`);
            console.log(`   Auto Approval: ${req.auto_approval_eligible}`);
            console.log(`   Description: ${req.description}`);
        } else {
            console.log('❌ No KYC requirements found for role:', user.role);
        }

        // Step 6: Analysis and recommendations
        console.log('\n6️⃣ Analysis and Recommendations:');
        
        if (!profile.kyc_submitted_at) {
            console.log('❌ ISSUE: KYC has not been submitted (kyc_submitted_at is NULL)');
            console.log('   SOLUTION: User needs to complete KYC submission process');
        }
        
        if (!profile.kycStatus || profile.kycStatus === 'PENDING') {
            console.log('❌ ISSUE: KYC status is not set or still pending');
            console.log('   SOLUTION: Update KYC status based on verification progress');
        }
        
        if (documentsResult.rows.length === 0) {
            console.log('❌ ISSUE: No KYC documents uploaded');
            console.log('   SOLUTION: User needs to upload required documents');
        } else {
            const verifiedDocs = documentsResult.rows.filter(doc => doc.verified);
            console.log(`📊 Document Status: ${verifiedDocs.length}/${documentsResult.rows.length} verified`);
        }
        
        if (!profile.identity_verified && !profile.address_verified && !profile.financial_verified && !profile.business_verified) {
            console.log('❌ ISSUE: No verification flags are set to true');
            console.log('   SOLUTION: Update verification flags based on document verification');
        }

        // Step 7: Suggested fixes
        console.log('\n7️⃣ Suggested Fixes:');
        
        if (documentsResult.rows.length > 0 && !profile.kyc_submitted_at) {
            console.log('🔧 Fix 1: Update kyc_submitted_at timestamp');
            console.log(`   UPDATE user_profiles SET kyc_submitted_at = NOW() WHERE id = '${profile.id}';`);
        }
        
        if (documentsResult.rows.some(doc => doc.verified) && profile.kycStatus !== 'APPROVED') {
            console.log('🔧 Fix 2: Update KYC status to APPROVED');
            console.log(`   UPDATE user_profiles SET "kycStatus" = 'APPROVED', "kycVerifiedAt" = NOW() WHERE id = '${profile.id}';`);
        }
        
        const verifiedIdentityDocs = documentsResult.rows.filter(doc => 
            doc.verified && (doc.document_category === 'IDENTITY' || doc.document_type.includes('IDENTITY'))
        );
        if (verifiedIdentityDocs.length > 0 && !profile.identity_verified) {
            console.log('🔧 Fix 3: Update identity_verified flag');
            console.log(`   UPDATE user_profiles SET identity_verified = true WHERE id = '${profile.id}';`);
        }
        
        if (profile.compliance_score === 0 && documentsResult.rows.some(doc => doc.verified)) {
            console.log('🔧 Fix 4: Update compliance score');
            console.log(`   UPDATE user_profiles SET compliance_score = 85 WHERE id = '${profile.id}';`);
        }

        await client.end();
        console.log('\n✅ Debug analysis complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

debugDeborahKycIssue();