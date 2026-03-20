/**
 * Check All Users in Database
 * Displays comprehensive user information
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAllUsers() {
    console.log('👥 Checking All Users in Database...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Get total user count
        const totalCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Total Users: ${totalCount.rows[0].count}\n`);

        // Get users by role
        const roleStats = await client.query(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        `);

        console.log('📈 Users by Role:\n');
        roleStats.rows.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count}`);
        });
        console.log('');

        // Get users by status
        const statusStats = await client.query(`
            SELECT status, COUNT(*) as count
            FROM users
            GROUP BY status
            ORDER BY count DESC
        `);

        console.log('📊 Users by Status:\n');
        statusStats.rows.forEach(stat => {
            console.log(`   ${stat.status}: ${stat.count}`);
        });
        console.log('');

        // Get all admin users
        const adminUsers = await client.query(`
            SELECT 
                u.id,
                u.email,
                u.role,
                u.status,
                u."tenantId",
                t.name as tenant_name,
                u."createdAt",
                u."emailVerifiedAt"
            FROM users u
            LEFT JOIN tenants t ON t.id = u."tenantId"
            WHERE u.role IN ('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN')
            ORDER BY 
                CASE u.role
                    WHEN 'SUPER_ADMIN' THEN 1
                    WHEN 'ADMIN' THEN 2
                    WHEN 'TENANT_ADMIN' THEN 3
                END,
                u."createdAt" ASC
        `);

        if (adminUsers.rows.length > 0) {
            console.log('👑 Admin Users:\n');
            adminUsers.rows.forEach((user, index) => {
                console.log(`${index + 1}. ${user.role}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🆔 ID: ${user.id}`);
                console.log(`   📊 Status: ${user.status}`);
                console.log(`   🏢 Tenant: ${user.tenant_name || 'N/A'}`);
                console.log(`   ✅ Verified: ${user.emailVerifiedAt ? 'Yes' : 'No'}`);
                console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleString()}`);
                console.log('');
            });
        }

        // Get recent users (last 10)
        const recentUsers = await client.query(`
            SELECT 
                u.id,
                u.email,
                u.role,
                u.status,
                t.name as tenant_name,
                u."createdAt"
            FROM users u
            LEFT JOIN tenants t ON t.id = u."tenantId"
            ORDER BY u."createdAt" DESC
            LIMIT 10
        `);

        console.log('🆕 Recent Users (Last 10):\n');
        recentUsers.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Role: ${user.role} | Status: ${user.status}`);
            console.log(`   Tenant: ${user.tenant_name || 'N/A'}`);
            console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
            console.log('');
        });

        // Get users by tenant
        const tenantStats = await client.query(`
            SELECT 
                t.name as tenant_name,
                t.id as tenant_id,
                COUNT(u.id) as user_count
            FROM tenants t
            LEFT JOIN users u ON u."tenantId" = t.id
            GROUP BY t.id, t.name
            ORDER BY user_count DESC
            LIMIT 10
        `);

        console.log('🏢 Users by Tenant (Top 10):\n');
        tenantStats.rows.forEach((stat, index) => {
            console.log(`${index + 1}. ${stat.tenant_name}`);
            console.log(`   Users: ${stat.user_count}`);
            console.log(`   Tenant ID: ${stat.tenant_id}`);
            console.log('');
        });

        // Get verified vs unverified
        const verificationStats = await client.query(`
            SELECT 
                COUNT(*) FILTER (WHERE "emailVerifiedAt" IS NOT NULL) as verified,
                COUNT(*) FILTER (WHERE "emailVerifiedAt" IS NULL) as unverified
            FROM users
        `);

        console.log('✉️ Email Verification:\n');
        console.log(`   Verified: ${verificationStats.rows[0].verified}`);
        console.log(`   Unverified: ${verificationStats.rows[0].unverified}`);
        console.log('');

        // Get users with 2FA enabled
        const twoFAStats = await client.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE "twoFactorEnabled" = true
        `);

        console.log('🔐 Two-Factor Authentication:\n');
        console.log(`   Enabled: ${twoFAStats.rows[0].count}`);
        console.log(`   Disabled: ${parseInt(totalCount.rows[0].count) - parseInt(twoFAStats.rows[0].count)}`);
        console.log('');

        // Search for specific users (optional)
        console.log('🔍 Quick Search Examples:\n');
        console.log('   To find a specific user:');
        console.log('   SELECT * FROM users WHERE email ILIKE \'%search%\';');
        console.log('');
        console.log('   To find users by role:');
        console.log('   SELECT * FROM users WHERE role = \'CARGO_OWNER\';');
        console.log('');

    } catch (error) {
        console.error('❌ Check failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('👋 Check complete\n');
    }
}

checkAllUsers();
