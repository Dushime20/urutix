/**
 * Fix Super Admin Permissions
 * Add required permissions to SUPER_ADMIN role
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixSuperAdminPermissions() {
    console.log('🔧 Fixing Super Admin permissions...\n');

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

        // Get the required permission IDs
        console.log('\n1️⃣ Getting required permission IDs...');
        const permissionsResult = await client.query(`
            SELECT id, name FROM permissions 
            WHERE name IN (
                'admin:view_all_tenants',
                'admin:manage_tenants',
                'admin:system_settings',
                'admin:manage_permissions'
            )
            ORDER BY name
        `);

        console.log(`📋 Found ${permissionsResult.rows.length} required permissions:`);
        permissionsResult.rows.forEach(perm => {
            console.log(`   ${perm.name} (${perm.id})`);
        });

        // Check existing SUPER_ADMIN permissions
        console.log('\n2️⃣ Checking existing SUPER_ADMIN permissions...');
        const existingResult = await client.query(`
            SELECT p.name, p.id
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role = 'SUPER_ADMIN'
            ORDER BY p.name
        `);

        console.log(`📋 SUPER_ADMIN currently has ${existingResult.rows.length} permissions:`);
        existingResult.rows.forEach(perm => {
            console.log(`   ${perm.name}`);
        });

        // Add missing permissions
        console.log('\n3️⃣ Adding missing permissions...');
        const existingPermissionIds = existingResult.rows.map(p => p.id);
        
        for (const permission of permissionsResult.rows) {
            if (!existingPermissionIds.includes(permission.id)) {
                console.log(`   Adding: ${permission.name}`);
                
                await client.query(`
                    INSERT INTO role_permissions (role, permission_id, granted_at)
                    VALUES ('SUPER_ADMIN', $1, NOW())
                    ON CONFLICT (role, permission_id) DO NOTHING
                `, [permission.id]);
                
                console.log(`   ✅ Added ${permission.name}`);
            } else {
                console.log(`   ✅ Already has ${permission.name}`);
            }
        }

        // Verify final permissions
        console.log('\n4️⃣ Verifying final permissions...');
        const finalResult = await client.query(`
            SELECT p.name
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role = 'SUPER_ADMIN'
            ORDER BY p.name
        `);

        console.log(`📋 SUPER_ADMIN now has ${finalResult.rows.length} permissions:`);
        finalResult.rows.forEach(perm => {
            console.log(`   ✅ ${perm.name}`);
        });

        await client.end();
        console.log('\n✅ Super Admin permissions fixed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

fixSuperAdminPermissions();