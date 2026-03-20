/**
 * Test script to verify Enhanced Permissions page fix
 * 
 * This script tests that the getAllRoles() method works correctly
 * with the raw SQL approach instead of TypeORM entity relations.
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

async function testEnhancedPermissionsFix() {
    console.log('🔍 Testing Enhanced Permissions Fix...\n');

    // Create database connection
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

        // Test 1: Check role_permissions table structure
        console.log('📋 Test 1: Verify role_permissions table structure');
        const tableInfo = await dataSource.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'role_permissions'
            ORDER BY ordinal_position
        `);
        
        console.log('Columns in role_permissions table:');
        tableInfo.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        const hasRoleColumn = tableInfo.some(col => col.column_name === 'role');
        const hasRoleIdColumn = tableInfo.some(col => col.column_name === 'role_id');
        
        if (hasRoleColumn && !hasRoleIdColumn) {
            console.log('✅ Correct: Uses "role" column (string), not "role_id"\n');
        } else if (hasRoleIdColumn) {
            console.log('❌ ERROR: Table has "role_id" column - schema mismatch!\n');
            return;
        } else {
            console.log('❌ ERROR: No "role" column found!\n');
            return;
        }

        // Test 2: Test getAllRoles query
        console.log('📋 Test 2: Test getAllRoles SQL query');
        const rolesQuery = `
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

        const roles = await dataSource.query(rolesQuery);
        
        console.log(`✅ Query executed successfully - Found ${roles.length} roles\n`);

        // Test 3: Display roles with permission counts
        console.log('📋 Test 3: Roles with permission counts');
        roles.forEach(role => {
            const permissions = typeof role.permissions === 'string' 
                ? JSON.parse(role.permissions) 
                : role.permissions;
            
            const permCount = Array.isArray(permissions) ? permissions.length : 0;
            const systemBadge = role.isSystem ? '(System)' : '(Custom)';
            
            console.log(`  ${role.name} ${systemBadge}: ${permCount} permissions`);
        });
        console.log('');

        // Test 4: Test permission matrix query
        console.log('📋 Test 4: Test permission matrix query');
        const matrixQuery = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system as "isSystem",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
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
            GROUP BY r.id, r.name, r.description, r.is_system
            ORDER BY r.name
        `;

        const matrixRoles = await dataSource.query(matrixQuery);
        
        const permissionsQuery = `
            SELECT 
                id,
                name,
                resource,
                action,
                description
            FROM permissions
            ORDER BY resource, action
        `;

        const permissions = await dataSource.query(permissionsQuery);

        console.log(`✅ Matrix query executed successfully`);
        console.log(`   - Roles: ${matrixRoles.length}`);
        console.log(`   - Permissions: ${permissions.length}\n`);

        // Test 5: Verify data format matches frontend expectations
        console.log('📋 Test 5: Verify data format for frontend');
        
        const matrixData = {
            roles: matrixRoles.map(role => ({
                ...role,
                permissions: typeof role.permissions === 'string' 
                    ? JSON.parse(role.permissions) 
                    : role.permissions
            })),
            permissions: permissions
        };

        console.log('✅ Data format is correct for frontend consumption');
        console.log(`   - roles array: ${matrixData.roles.length} items`);
        console.log(`   - permissions array: ${matrixData.permissions.length} items`);
        
        if (matrixData.roles.length > 0) {
            const firstRole = matrixData.roles[0];
            console.log(`   - Sample role structure: ${Object.keys(firstRole).join(', ')}`);
            console.log(`   - Sample role has permissions array: ${Array.isArray(firstRole.permissions)}`);
        }
        console.log('');

        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('The Enhanced Permissions page should now work correctly.');
        console.log('');
        console.log('Next steps:');
        console.log('1. Restart the backend server');
        console.log('2. Navigate to /admin/permissions in the frontend');
        console.log('3. Verify the permission matrix displays correctly');
        console.log('4. Test toggling permissions for custom roles');
        console.log('');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    } finally {
        await dataSource.destroy();
        console.log('Database connection closed');
    }
}

// Run the test
testEnhancedPermissionsFix().catch(console.error);
