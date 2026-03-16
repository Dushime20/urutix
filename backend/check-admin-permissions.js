/**
 * Check Admin User Permissions
 * Verify if admin@urutix.com has the required permissions
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAdminPermissions() {
    console.log('🔍 Checking admin user permissions...\n');

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

        // Find the admin user
        console.log('\n1️⃣ Finding admin user...');
        const userResult = await client.query(`
            SELECT id, email, role, status
            FROM users 
            WHERE email = 'admin@urutix.com'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ Admin user not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.email} (${user.role})`);

        // Check if permissions table exists
        console.log('\n2️⃣ Checking permissions system...');
        const permissionsTableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'permissions'
            );
        `);

        if (!permissionsTableResult.rows[0].exists) {
            console.log('❌ Permissions table does not exist');
            return;
        }

        // Check role_permissions table
        const rolePermissionsTableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'role_permissions'
            );
        `);

        if (!rolePermissionsTableResult.rows[0].exists) {
            console.log('❌ Role permissions table does not exist');
            return;
        }

        console.log('✅ Permissions tables exist');

        // Check what permissions exist
        console.log('\n3️⃣ Checking available permissions...');
        const allPermissionsResult = await client.query(`
            SELECT name, description FROM permissions
            WHERE name LIKE '%admin%' OR name LIKE '%tenant%'
            ORDER BY name
        `);

        console.log('📋 Available admin/tenant permissions:');
        allPermissionsResult.rows.forEach(perm => {
            console.log(`   ${perm.name}: ${perm.description}`);
        });

        // Check role permissions for SUPER_ADMIN role
        console.log('\n4️⃣ Checking SUPER_ADMIN role permissions...');
        const superAdminPermissionsResult = await client.query(`
            SELECT p.name, p.description
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role = 'SUPER_ADMIN'
            ORDER BY p.name
        `);

        console.log(`📋 SUPER_ADMIN role has ${superAdminPermissionsResult.rows.length} permissions:`);
        superAdminPermissionsResult.rows.forEach(perm => {
            console.log(`   ✅ ${perm.name}`);
        });

        // Check if super_admin permission exists
        const superAdminPermResult = await client.query(`
            SELECT * FROM permissions WHERE name = 'super_admin'
        `);

        if (superAdminPermResult.rows.length === 0) {
            console.log('\n❌ "super_admin" permission does not exist!');
            console.log('   This is likely the cause of the 401 error.');
            
            // Check what permissions might be similar
            const similarPermResult = await client.query(`
                SELECT name FROM permissions 
                WHERE name ILIKE '%super%' OR name ILIKE '%admin%'
                ORDER BY name
            `);
            
            if (similarPermResult.rows.length > 0) {
                console.log('\n🔍 Similar permissions found:');
                similarPermResult.rows.forEach(perm => {
                    console.log(`   ${perm.name}`);
                });
            }
        } else {
            console.log('\n✅ "super_admin" permission exists');
            
            // Check if SUPER_ADMIN role has this permission
            const hasPermissionResult = await client.query(`
                SELECT COUNT(*) as count
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role = 'SUPER_ADMIN' AND p.name = 'super_admin'
            `);
            
            if (hasPermissionResult.rows[0].count > 0) {
                console.log('✅ SUPER_ADMIN role has super_admin permission');
            } else {
                console.log('❌ SUPER_ADMIN role does NOT have super_admin permission');
            }
        }

        await client.end();
        console.log('\n✅ Permission check complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

checkAdminPermissions();