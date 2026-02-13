const { Client } = require('pg');
require('dotenv').config();

async function fixPermissionsSchema() {
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Drop existing tables and recreate with correct schema
        console.log('🗑️  Dropping existing permissions tables...');
        
        await client.query('DROP TABLE IF EXISTS permission_audit_log CASCADE');
        await client.query('DROP TABLE IF EXISTS user_permissions CASCADE');
        await client.query('DROP TABLE IF EXISTS role_permissions CASCADE');
        await client.query('DROP TABLE IF EXISTS permissions CASCADE');
        await client.query('DROP VIEW IF EXISTS user_all_permissions CASCADE');
        
        console.log('✅ Old tables dropped\n');

        // Create permissions table with correct schema
        console.log('📝 Creating permissions table...');
        await client.query(`
            CREATE TABLE permissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) UNIQUE NOT NULL,
                resource VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        await client.query('CREATE INDEX idx_permissions_resource ON permissions(resource)');
        await client.query('CREATE INDEX idx_permissions_name ON permissions(name)');
        await client.query('CREATE INDEX idx_permissions_action ON permissions(action)');
        
        console.log('✅ Permissions table created\n');

        // Create role_permissions table
        console.log('📝 Creating role_permissions table...');
        await client.query(`
            CREATE TABLE role_permissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                role VARCHAR(50) NOT NULL,
                permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                granted_at TIMESTAMP DEFAULT NOW(),
                granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE(role, permission_id)
            );
        `);
        
        await client.query('CREATE INDEX idx_role_permissions_role ON role_permissions(role)');
        await client.query('CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id)');
        
        console.log('✅ Role_permissions table created\n');

        // Create user_permissions table
        console.log('📝 Creating user_permissions table...');
        await client.query(`
            CREATE TABLE user_permissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                is_granted BOOLEAN NOT NULL DEFAULT true,
                granted_at TIMESTAMP DEFAULT NOW(),
                granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
                reason TEXT,
                expires_at TIMESTAMP,
                UNIQUE(user_id, permission_id)
            );
        `);
        
        await client.query('CREATE INDEX idx_user_permissions_user ON user_permissions(user_id)');
        await client.query('CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id)');
        await client.query('CREATE INDEX idx_user_permissions_granted ON user_permissions(is_granted)');
        
        console.log('✅ User_permissions table created\n');

        // Insert core permissions
        console.log('📝 Inserting core permissions...');
        
        const permissions = [
            // Cargo permissions
            ['cargo:create', 'cargo', 'create', 'Create new cargo listings'],
            ['cargo:view_own', 'cargo', 'view_own', 'View own cargo'],
            ['cargo:view_all', 'cargo', 'view_all', 'View all cargo in tenant'],
            ['cargo:view_all_tenants', 'cargo', 'view_all_tenants', 'View cargo across all tenants (admin)'],
            ['cargo:update_own', 'cargo', 'update_own', 'Update own cargo'],
            ['cargo:update_all', 'cargo', 'update_all', 'Update any cargo in tenant'],
            ['cargo:delete_own', 'cargo', 'delete_own', 'Delete own cargo'],
            ['cargo:delete_all', 'cargo', 'delete_all', 'Delete any cargo in tenant'],
            ['cargo:publish', 'cargo', 'publish', 'Publish cargo to marketplace'],
            ['cargo:archive', 'cargo', 'archive', 'Archive cargo'],
            
            // Truck permissions
            ['truck:create', 'truck', 'create', 'Register new trucks'],
            ['truck:view_own', 'truck', 'view_own', 'View own fleet'],
            ['truck:view_all', 'truck', 'view_all', 'View all trucks in tenant'],
            ['truck:view_all_tenants', 'truck', 'view_all_tenants', 'View trucks across all tenants (admin)'],
            ['truck:update_own', 'truck', 'update_own', 'Update own trucks'],
            ['truck:update_all', 'truck', 'update_all', 'Update any truck in tenant'],
            ['truck:delete_own', 'truck', 'delete_own', 'Delete own trucks'],
            ['truck:delete_all', 'truck', 'delete_all', 'Delete any truck in tenant'],
            ['truck:assign_driver', 'truck', 'assign_driver', 'Assign drivers to trucks'],
            ['truck:maintenance', 'truck', 'maintenance', 'Schedule and manage truck maintenance'],
            
            // Driver permissions
            ['driver:create', 'driver', 'create', 'Register new drivers'],
            ['driver:view_own', 'driver', 'view_own', 'View own drivers'],
            ['driver:view_all', 'driver', 'view_all', 'View all drivers in tenant'],
            ['driver:manage_own', 'driver', 'manage_own', 'Manage own drivers'],
            ['driver:manage_all', 'driver', 'manage_all', 'Manage all drivers in tenant'],
            ['driver:delete', 'driver', 'delete', 'Delete drivers'],
            
            // Trip permissions
            ['trip:view_assigned', 'trip', 'view_assigned', 'View assigned trips'],
            ['trip:view_all', 'trip', 'view_all', 'View all trips in tenant'],
            ['trip:create', 'trip', 'create', 'Create trips'],
            ['trip:update_status', 'trip', 'update_status', 'Update trip status'],
            ['trip:complete', 'trip', 'complete', 'Mark trip as complete'],
            ['trip:cancel', 'trip', 'cancel', 'Cancel trips'],
            
            // Payment permissions
            ['payment:view_own', 'payment', 'view_own', 'View own payments'],
            ['payment:view_all', 'payment', 'view_all', 'View all payments in tenant'],
            ['payment:create', 'payment', 'create', 'Initiate payments'],
            ['payment:approve', 'payment', 'approve', 'Approve payments'],
            ['payment:cancel', 'payment', 'cancel', 'Cancel payments'],
            
            // User management
            ['user:view_own', 'user', 'view_own', 'View own profile'],
            ['user:view_tenant', 'user', 'view_tenant', 'View users in tenant'],
            ['user:view_all', 'user', 'view_all', 'View all users across tenants'],
            ['user:create', 'user', 'create', 'Create new users'],
            ['user:update', 'user', 'update', 'Update user details'],
            ['user:delete', 'user', 'delete', 'Delete users'],
            ['user:assign_role', 'user', 'assign_role', 'Assign roles to users'],
            ['user:manage_permissions', 'user', 'manage_permissions', 'Manage user-specific permissions'],
            
            // Analytics permissions
            ['analytics:view_own', 'analytics', 'view_own', 'View own analytics'],
            ['analytics:view_tenant', 'analytics', 'view_tenant', 'View tenant-wide analytics'],
            ['analytics:view_all', 'analytics', 'view_all', 'View system-wide analytics'],
            
            // Admin permissions
            ['admin:manage_permissions', 'admin', 'manage_permissions', 'Manage system permissions'],
            ['admin:view_all_tenants', 'admin', 'view_all_tenants', 'View all tenants'],
            ['admin:manage_tenants', 'admin', 'manage_tenants', 'Create, update, delete tenants'],
            ['admin:view_audit_log', 'admin', 'view_audit_log', 'View permission audit log'],
            ['admin:system_settings', 'admin', 'system_settings', 'Manage system settings']
        ];

        for (const [name, resource, action, description] of permissions) {
            await client.query(
                'INSERT INTO permissions (name, resource, action, description) VALUES ($1, $2, $3, $4)',
                [name, resource, action, description]
            );
        }
        
        const countResult = await client.query('SELECT COUNT(*) FROM permissions');
        console.log(`✅ Inserted ${countResult.rows[0].count} permissions\n`);

        // Assign permissions to roles
        console.log('📝 Assigning permissions to roles...');
        
        // CARGO_OWNER role
        const cargoOwnerPerms = ['cargo:create', 'cargo:view_own', 'cargo:update_own', 'cargo:delete_own', 
                                  'cargo:publish', 'payment:view_own', 'payment:create', 'trip:view_assigned', 
                                  'analytics:view_own', 'user:view_own'];
        
        for (const permName of cargoOwnerPerms) {
            await client.query(`
                INSERT INTO role_permissions (role, permission_id)
                SELECT 'CARGO_OWNER', id FROM permissions WHERE name = $1
            `, [permName]);
        }
        
        // TRUCK_OWNER role
        const truckOwnerPerms = ['truck:create', 'truck:view_own', 'truck:update_own', 'truck:delete_own',
                                  'truck:assign_driver', 'truck:maintenance', 'driver:create', 'driver:view_own',
                                  'driver:manage_own', 'payment:view_own', 'trip:view_all', 'analytics:view_own', 
                                  'user:view_own'];
        
        for (const permName of truckOwnerPerms) {
            await client.query(`
                INSERT INTO role_permissions (role, permission_id)
                SELECT 'TRUCK_OWNER', id FROM permissions WHERE name = $1
            `, [permName]);
        }
        
        // DRIVER role
        const driverPerms = ['trip:view_assigned', 'trip:update_status', 'trip:complete', 'user:view_own'];
        
        for (const permName of driverPerms) {
            await client.query(`
                INSERT INTO role_permissions (role, permission_id)
                SELECT 'DRIVER', id FROM permissions WHERE name = $1
            `, [permName]);
        }
        
        // ADMIN role
        const adminPerms = ['admin:view_all_tenants', 'admin:manage_tenants', 'admin:view_audit_log',
                            'user:view_all', 'user:create', 'user:update', 'user:delete', 'user:assign_role',
                            'cargo:view_all_tenants', 'truck:view_all_tenants', 'analytics:view_all'];
        
        for (const permName of adminPerms) {
            await client.query(`
                INSERT INTO role_permissions (role, permission_id)
                SELECT 'ADMIN', id FROM permissions WHERE name = $1
            `, [permName]);
        }
        
        const rolePermsCount = await client.query('SELECT COUNT(*) FROM role_permissions');
        console.log(`✅ Created ${rolePermsCount.rows[0].count} role-permission mappings\n`);

        console.log('🎉 Permissions schema fixed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

fixPermissionsSchema();
