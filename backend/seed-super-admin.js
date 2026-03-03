/**
 * Seed Super Admin User
 * Creates a default super admin user for system access
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SUPER_ADMIN = {
    email: 'superadmin@urutix.com',
    password: 'SuperAdmin@123',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
};

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function seedSuperAdmin() {
    console.log('🌱 Seeding Super Admin User...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if default tenant exists
        const tenantCheck = await client.query(
            'SELECT id, name FROM tenants WHERE id = $1',
            [DEFAULT_TENANT_ID]
        );

        let tenantId = DEFAULT_TENANT_ID;
        let tenantName = 'System';

        if (tenantCheck.rows.length === 0) {
            console.log('📝 Creating default system tenant...');
            await client.query(`
                INSERT INTO tenants (id, name, status, "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `, [DEFAULT_TENANT_ID, 'System', 'ACTIVE', true]);
            console.log('✅ System tenant created\n');
        } else {
            tenantName = tenantCheck.rows[0].name;
            console.log(`✅ Using existing tenant: ${tenantName}\n`);
        }

        // Check if super admin already exists
        const existingAdmin = await client.query(
            'SELECT id, email, role FROM users WHERE email = $1',
            [SUPER_ADMIN.email]
        );

        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Super admin already exists:');
            console.log(`   Email: ${existingAdmin.rows[0].email}`);
            console.log(`   Role: ${existingAdmin.rows[0].role}`);
            console.log(`   ID: ${existingAdmin.rows[0].id}\n`);
            
            // Ask if user wants to update password
            console.log('💡 To update the password, delete the user first or use a different email.\n');
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 14);
        console.log('✅ Password hashed\n');

        // Create super admin user
        console.log('👤 Creating super admin user...');
        const result = await client.query(`
            INSERT INTO users (
                "tenantId",
                email,
                "passwordHash",
                role,
                status,
                "emailVerifiedAt",
                "createdAt",
                "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
            RETURNING id, email, role, status
        `, [
            tenantId,
            SUPER_ADMIN.email,
            passwordHash,
            SUPER_ADMIN.role,
            SUPER_ADMIN.status,
        ]);

        const user = result.rows[0];
        console.log('✅ Super admin user created!\n');

        // Create user profile
        console.log('📋 Creating user profile...');
        await client.query(`
            INSERT INTO user_profiles (
                "userId",
                "tenantId",
                "firstName",
                "lastName",
                "createdAt",
                "updatedAt"
            )
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT ("userId") DO NOTHING
        `, [
            user.id,
            tenantId,
            'Super',
            'Admin',
        ]);
        console.log('✅ User profile created\n');

        // Display credentials
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 SUPER ADMIN USER CREATED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('📧 Email:    ', SUPER_ADMIN.email);
        console.log('🔑 Password: ', SUPER_ADMIN.password);
        console.log('👤 Role:     ', user.role);
        console.log('📊 Status:   ', user.status);
        console.log('🆔 User ID:  ', user.id);
        console.log('🏢 Tenant:   ', tenantName);
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('✅ You can now login with these credentials\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('👋 Seeding complete\n');
    }
}

seedSuperAdmin();
