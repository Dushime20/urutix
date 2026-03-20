/**
 * Debug Tenant Management 500 Error
 * Investigating the /api/admin/tenant-management endpoint failure
 */

const { Client } = require('pg');
require('dotenv').config();

async function debugTenantManagement500() {
    console.log('🔍 Debugging tenant management 500 error...\n');

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

        // Check if tenants table exists and has data
        console.log('\n1️⃣ Checking tenants table...');
        const tenantsResult = await client.query(`
            SELECT COUNT(*) as count FROM tenants
        `);
        console.log(`📊 Found ${tenantsResult.rows[0].count} tenants`);

        // Check tenants table structure
        console.log('\n2️⃣ Checking tenants table structure...');
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tenants'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Tenants table columns:');
        structureResult.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check for any tenants with missing required fields
        console.log('\n3️⃣ Checking for data integrity issues...');
        const integrityResult = await client.query(`
            SELECT 
                id,
                name,
                email,
                status,
                "createdAt",
                "updatedAt"
            FROM tenants 
            WHERE name IS NULL OR email IS NULL OR status IS NULL
            LIMIT 5
        `);
        
        if (integrityResult.rows.length > 0) {
            console.log('❌ Found tenants with missing required fields:');
            integrityResult.rows.forEach(tenant => {
                console.log(`   ID: ${tenant.id}, Name: ${tenant.name}, Email: ${tenant.email}, Status: ${tenant.status}`);
            });
        } else {
            console.log('✅ No data integrity issues found');
        }

        // Check if tenant-management service/controller exists
        console.log('\n4️⃣ Sample tenant data:');
        const sampleResult = await client.query(`
            SELECT 
                id,
                name,
                email,
                status,
                "createdAt"
            FROM tenants 
            ORDER BY "createdAt" DESC
            LIMIT 3
        `);
        
        sampleResult.rows.forEach((tenant, index) => {
            console.log(`   ${index + 1}. ${tenant.name} (${tenant.email}) - ${tenant.status}`);
            console.log(`      ID: ${tenant.id}`);
            console.log(`      Created: ${tenant.createdAt}`);
            console.log('');
        });

        // Check for any foreign key constraints that might be causing issues
        console.log('\n5️⃣ Checking related tables...');
        
        // Check users table for tenant relationships
        const usersResult = await client.query(`
            SELECT COUNT(*) as count FROM users WHERE "tenantId" IS NOT NULL
        `);
        console.log(`👥 Found ${usersResult.rows[0].count} users with tenant assignments`);

        // Check user_profiles table
        const profilesResult = await client.query(`
            SELECT COUNT(*) as count FROM user_profiles WHERE "tenantId" IS NOT NULL
        `);
        console.log(`📋 Found ${profilesResult.rows[0].count} user profiles with tenant assignments`);

        await client.end();
        console.log('\n✅ Debug analysis complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        await client.end();
    }
}

debugTenantManagement500();