const { DataSource } = require('typeorm');
require('dotenv').config();

/**
 * Seed script to populate the roles table with system roles
 * This ensures all UserRole enum values exist in the database
 */

const SYSTEM_ROLES = [
    {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full system access. Can manage all tenants, users, and system settings.',
        isSystem: true
    },
    {
        name: 'ADMIN',
        description: 'Administrator with broad access. Can manage users, loads, and most system features.',
        isSystem: true
    },
    {
        name: 'TENANT_ADMIN',
        description: 'Tenant Administrator. Manages users and operations within their tenant organization.',
        isSystem: true
    },
    {
        name: 'CARGO_OWNER',
        description: 'Cargo Owner. Can create and manage cargo loads, track shipments, and manage payments.',
        isSystem: true
    },
    {
        name: 'TRUCK_OWNER',
        description: 'Truck Owner. Manages fleet, drivers, and accepts cargo loads for transportation.',
        isSystem: true
    },
    {
        name: 'DRIVER',
        description: 'Driver. Operates trucks, updates trip status, and manages deliveries.',
        isSystem: true
    },
    {
        name: 'AGENT',
        description: 'Agent. Facilitates transactions between cargo owners and truck owners.',
        isSystem: true
    },
    {
        name: 'LENDER',
        description: 'Lender. Provides financing services and manages loan applications.',
        isSystem: true
    },
    {
        name: 'BROKER',
        description: 'Broker. Connects cargo owners with truck owners and manages load matching.',
        isSystem: true
    }
];

async function seedRoles() {
    console.log('🌱 Starting role seeding process...\n');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'urutix',
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected\n');

        let createdCount = 0;
        let existingCount = 0;
        let updatedCount = 0;

        for (const role of SYSTEM_ROLES) {
            console.log(`📋 Processing role: ${role.name}`);

            // Check if role already exists
            const existing = await dataSource.query(
                'SELECT id, name, description, is_system FROM roles WHERE name = $1',
                [role.name]
            );

            if (existing.length > 0) {
                console.log(`   ℹ️  Role already exists`);
                
                // Update description if it's different
                if (existing[0].description !== role.description) {
                    await dataSource.query(
                        `UPDATE roles 
                         SET description = $1, updated_at = NOW()
                         WHERE name = $2`,
                        [role.description, role.name]
                    );
                    console.log(`   ✅ Updated description`);
                    updatedCount++;
                } else {
                    existingCount++;
                }
            } else {
                // Create new role
                await dataSource.query(
                    `INSERT INTO roles (name, description, is_system, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW())`,
                    [role.name, role.description, role.isSystem]
                );
                console.log(`   ✅ Created new role`);
                createdCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Seeding Summary:');
        console.log(`   ✅ Created: ${createdCount} roles`);
        console.log(`   🔄 Updated: ${updatedCount} roles`);
        console.log(`   ℹ️  Already existed: ${existingCount} roles`);
        console.log(`   📋 Total processed: ${SYSTEM_ROLES.length} roles`);

        // Show all roles in database
        console.log('\n📋 All roles in database:');
        const allRoles = await dataSource.query(
            `SELECT id, name, description, is_system as "isSystem"
             FROM roles 
             ORDER BY is_system DESC, name ASC`
        );

        console.log('\n');
        allRoles.forEach(role => {
            const badge = role.isSystem ? '🔒 System' : '✏️  Custom';
            const desc = role.description ? role.description.substring(0, 60) + '...' : 'No description';
            console.log(`   ${badge} | ${role.name.padEnd(20)} | ${desc}`);
        });

        // Note about permissions
        console.log('\n💡 Note: Permissions need to be assigned to these roles.');
        console.log('   Use the Enhanced Permissions page to assign permissions to each role.');

        await dataSource.destroy();
        console.log('\n✅ Role seeding completed successfully!\n');
    } catch (error) {
        console.error('❌ Error seeding roles:', error.message);
        console.error(error.stack);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}

seedRoles();
