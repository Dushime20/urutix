/**
 * Test the getAllRoles endpoint to diagnose the 500 error
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

async function testGetAllRoles() {
    console.log('🔍 Testing getAllRoles endpoint...\n');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'urutix',
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected\n');

        // Test the exact query used in getAllRoles()
        console.log('📋 Testing getAllRoles query...');
        const query = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system as "isSystem",
                r.created_at as "createdAt",
                r.updated_at as "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'resource', p.resource,
                            'action', p.action,
                            'description', p.description
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.name = rp.role
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
            ORDER BY r.name ASC
        `;

        const roles = await dataSource.query(query);
        
        console.log(`✅ Query executed successfully - Found ${roles.length} roles\n`);

        // Test JSON parsing
        console.log('📋 Testing JSON parsing...');
        const parsedRoles = roles.map(role => {
            const permissions = typeof role.permissions === 'string' 
                ? JSON.parse(role.permissions) 
                : role.permissions;
            
            return {
                ...role,
                permissions
            };
        });

        console.log('✅ JSON parsing successful\n');

        // Display sample role
        if (parsedRoles.length > 0) {
            console.log('📋 Sample role structure:');
            const sample = parsedRoles[0];
            console.log(JSON.stringify({
                id: sample.id,
                name: sample.name,
                description: sample.description,
                isSystem: sample.isSystem,
                permissionCount: sample.permissions.length,
                samplePermission: sample.permissions[0] || null
            }, null, 2));
        }

        console.log('\n✅ All tests passed - getAllRoles should work correctly');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nFull error:');
        console.error(error);
    } finally {
        await dataSource.destroy();
    }
}

testGetAllRoles().catch(console.error);
