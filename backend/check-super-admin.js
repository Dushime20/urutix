/**
 * Check Super Admin Credentials
 * This script checks for super admin users in the database
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkSuperAdmin() {
    console.log('🔍 Checking Super Admin Credentials...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check for ADMIN role users
        const adminUsers = await client.query(`
            SELECT 
                u.id,
                u.email,
                u.role,
                u.status,
                u."tenantId",
                t.name as tenant_name,
                u."createdAt"
            FROM users u
            LEFT JOIN tenants t ON t.id = u."tenantId"
            WHERE u.role = 'ADMIN' OR u.role = 'SUPER_ADMIN'
            ORDER BY u."createdAt" ASC
        `);

        if (adminUsers.rows.length === 0) {
            console.log('❌ No super admin users found!\n');
            console.log('💡 You may need to create a super admin user.\n');
            console.log('📝 Common super admin credentials to try:');
            console.log('   Email: admin@urutix.com');
            console.log('   Email: admin@example.com');
            console.log('   Email: superadmin@urutix.com\n');
        } else {
            console.log(`✅ Found ${adminUsers.rows.length} super admin user(s):\n`);
            
            adminUsers.rows.forEach((user, index) => {
                console.log(`${index + 1}. Super Admin User:`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🆔 ID: ${user.id}`);
                console.log(`   👤 Role: ${user.role}`);
                console.log(`   📊 Status: ${user.status}`);
                console.log(`   🏢 Tenant: ${user.tenant_name || 'N/A'} (${user.tenantId || 'N/A'})`);
                console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleString()}`);
                console.log('');
            });

            console.log('🔑 To login, use one of the emails above with your password.\n');
            console.log('❓ If you forgot the password, you can reset it via:');
            console.log('   1. Password reset flow in the app');
            console.log('   2. Direct database update (for development)\n');
        }

        // Check for any users with email containing 'admin'
        const adminEmailUsers = await client.query(`
            SELECT 
                u.id,
                u.email,
                u.role,
                u.status
            FROM users u
            WHERE u.email ILIKE '%admin%'
            AND u.role != 'ADMIN'
            AND u.role != 'SUPER_ADMIN'
            ORDER BY u."createdAt" ASC
        `);

        if (adminEmailUsers.rows.length > 0) {
            console.log('ℹ️  Other users with "admin" in email (not ADMIN role):\n');
            adminEmailUsers.rows.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} - Role: ${user.role} - Status: ${user.status}`);
            });
            console.log('');
        }

        // Show total user count
        const totalUsers = await client.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Total users in database: ${totalUsers.rows[0].count}\n`);

        // Check default tenant
        const defaultTenant = await client.query(`
            SELECT id, name, status 
            FROM tenants 
            WHERE id = '00000000-0000-0000-0000-000000000001'
        `);

        if (defaultTenant.rows.length > 0) {
            console.log('🏢 Default Tenant (System):');
            console.log(`   Name: ${defaultTenant.rows[0].name}`);
            console.log(`   Status: ${defaultTenant.rows[0].status}`);
            console.log(`   ID: ${defaultTenant.rows[0].id}\n`);
        }

    } catch (error) {
        console.error('❌ Check failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('👋 Check complete\n');
    }
}

checkSuperAdmin();
