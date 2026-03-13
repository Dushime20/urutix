/**
 * Seed KYC Requirements for All User Roles
 */

const { Client } = require('pg');
require('dotenv').config();

async function seedKycRequirements() {
    console.log('🌱 Seeding KYC requirements for all user roles...\n');

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

        // Check if kyc_role_requirements table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'kyc_role_requirements'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ kyc_role_requirements table does not exist');
            console.log('   Please run the KYC migration first');
            return;
        }

        // Define KYC requirements for each role
        const kycRequirements = [
            {
                role: 'SUPER_ADMIN',
                requirement_level: 'PREMIUM',
                required_documents: ['IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'EMPLOYMENT_VERIFICATION'],
                optional_documents: ['PROFESSIONAL_LICENSE'],
                verification_steps: ['identity_verification', 'address_verification', 'background_check'],
                auto_approval_eligible: false,
                description: 'Premium KYC verification required for super admin access with comprehensive background checks.'
            },
            {
                role: 'ADMIN',
                requirement_level: 'ENHANCED',
                required_documents: ['IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'EMPLOYMENT_VERIFICATION'],
                optional_documents: ['PROFESSIONAL_LICENSE'],
                verification_steps: ['identity_verification', 'address_verification', 'employment_verification'],
                auto_approval_eligible: false,
                description: 'Enhanced KYC verification required for admin access with employment verification.'
            },
            {
                role: 'TENANT_ADMIN',
                requirement_level: 'ENHANCED',
                required_documents: ['BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'AUTHORIZED_REPRESENTATIVE_ID'],
                optional_documents: ['BANK_STATEMENT', 'INSURANCE_CERTIFICATE', 'OPERATING_LICENSE'],
                verification_steps: ['business_verification', 'tax_verification', 'representative_verification'],
                auto_approval_eligible: false,
                description: 'Enhanced business verification for tenant organizations that will onboard and manage other businesses on the platform. Requires comprehensive business documentation and authorized representative verification.'
            },
            {
                role: 'CARGO_OWNER',
                requirement_level: 'ENHANCED',
                required_documents: ['IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'BUSINESS_REGISTRATION'],
                optional_documents: ['TAX_CERTIFICATE', 'INSURANCE_CERTIFICATE'],
                verification_steps: ['identity_verification', 'address_verification', 'business_verification'],
                auto_approval_eligible: true,
                description: 'Enhanced KYC verification for cargo owners with business registration and insurance requirements.'
            },
            {
                role: 'TRUCK_OWNER',
                requirement_level: 'ENHANCED',
                required_documents: ['IDENTITY_DOCUMENT', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE_CERTIFICATE'],
                optional_documents: ['COMMERCIAL_LICENSE', 'SAFETY_CERTIFICATE'],
                verification_steps: ['identity_verification', 'license_verification', 'vehicle_verification', 'insurance_verification'],
                auto_approval_eligible: true,
                description: 'Enhanced KYC verification for truck owners including vehicle and insurance documentation.'
            },
            {
                role: 'DRIVER',
                requirement_level: 'BASIC',
                required_documents: ['IDENTITY_DOCUMENT', 'DRIVERS_LICENSE'],
                optional_documents: ['MEDICAL_CERTIFICATE', 'EXPERIENCE_CERTIFICATE'],
                verification_steps: ['identity_verification', 'license_verification'],
                auto_approval_eligible: true,
                description: 'Basic KYC verification for drivers with valid driving license and identity verification.'
            },
            {
                role: 'BROKER',
                requirement_level: 'ENHANCED',
                required_documents: ['IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'BROKER_LICENSE'],
                optional_documents: ['BUSINESS_REGISTRATION', 'FINANCIAL_STATEMENT'],
                verification_steps: ['identity_verification', 'address_verification', 'license_verification'],
                auto_approval_eligible: false,
                description: 'Enhanced KYC verification for brokers with professional license and address verification.'
            },
            {
                role: 'LENDER',
                requirement_level: 'PREMIUM',
                required_documents: ['IDENTITY_DOCUMENT', 'ADDRESS_PROOF', 'FINANCIAL_LICENSE', 'FINANCIAL_STATEMENT'],
                optional_documents: ['CREDIT_REPORT', 'AUDIT_REPORT'],
                verification_steps: ['identity_verification', 'address_verification', 'financial_verification', 'compliance_check'],
                auto_approval_eligible: false,
                description: 'Premium KYC verification for lenders with comprehensive financial documentation and compliance checks.'
            }
        ];

        // Clear existing requirements
        console.log('🧹 Clearing existing KYC requirements...');
        await client.query('DELETE FROM kyc_role_requirements');

        // Insert new requirements
        console.log('📝 Inserting KYC requirements...');
        for (const req of kycRequirements) {
            const result = await client.query(`
                INSERT INTO kyc_role_requirements (
                    id, role, requirement_level, required_documents, optional_documents,
                    verification_steps, auto_approval_eligible, description, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
                ) RETURNING id, role
            `, [
                req.role,
                req.requirement_level,
                req.required_documents,
                req.optional_documents,
                req.verification_steps,
                req.auto_approval_eligible,
                req.description
            ]);

            console.log(`   ✅ ${req.role}: ${req.requirement_level} level (${req.required_documents.length} required docs)`);
        }

        // Verify seeding
        console.log('\n🔍 Verifying seeded data...');
        const verifyResult = await client.query(`
            SELECT role, requirement_level, 
                   array_length(required_documents::text[], 1) as required_count,
                   array_length(optional_documents::text[], 1) as optional_count
            FROM kyc_role_requirements 
            ORDER BY role
        `);

        console.log('📊 KYC Requirements Summary:');
        verifyResult.rows.forEach(row => {
            console.log(`   ${row.role}: ${row.requirement_level} (${row.required_count || 0} required, ${row.optional_count || 0} optional)`);
        });

        await client.end();
        console.log('\n✅ KYC requirements seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding KYC requirements:', error.message);
        await client.end();
        process.exit(1);
    }
}

seedKycRequirements();