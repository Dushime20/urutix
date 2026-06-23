#!/usr/bin/env node
/**
 * Seed permissions and role permissions into the database
 * Run with: node seed-permissions.js
 * Or in Docker: docker-compose exec backend node seed-permissions.js
 */

const { Client } = require('pg');

// Database configuration from environment or defaults
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

console.log('🔌 Connecting to database:', config.database);

const client = new Client(config);

// All system permissions
const permissions = [
  // User Management
  { resource: 'user', action: 'create', description: 'Create new users' },
  { resource: 'user', action: 'read', description: 'View user details' },
  { resource: 'user', action: 'update', description: 'Update user information' },
  { resource: 'user', action: 'delete', description: 'Delete users' },
  { resource: 'user', action: 'list', description: 'List all users' },
  { resource: 'user', action: 'suspend', description: 'Suspend user accounts' },
  { resource: 'user', action: 'activate', description: 'Activate user accounts' },

  // Cargo Management
  { resource: 'cargo', action: 'create', description: 'Create new cargo' },
  { resource: 'cargo', action: 'read', description: 'View cargo details' },
  { resource: 'cargo', action: 'update', description: 'Update cargo information' },
  { resource: 'cargo', action: 'delete', description: 'Delete cargo' },
  { resource: 'cargo', action: 'list', description: 'List all cargo' },
  { resource: 'cargo', action: 'assign', description: 'Assign cargo to trucks' },
  { resource: 'cargo', action: 'track', description: 'Track cargo location' },

  // Truck Management
  { resource: 'truck', action: 'create', description: 'Register new trucks' },
  { resource: 'truck', action: 'read', description: 'View truck details' },
  { resource: 'truck', action: 'update', description: 'Update truck information' },
  { resource: 'truck', action: 'delete', description: 'Remove trucks' },
  { resource: 'truck', action: 'list', description: 'List all trucks' },
  { resource: 'truck', action: 'assign', description: 'Assign trucks to trips' },
  { resource: 'truck', action: 'track', description: 'Track truck location' },

  // Trip Management
  { resource: 'trip', action: 'create', description: 'Create new trips' },
  { resource: 'trip', action: 'read', description: 'View trip details' },
  { resource: 'trip', action: 'update', description: 'Update trip information' },
  { resource: 'trip', action: 'delete', description: 'Cancel trips' },
  { resource: 'trip', action: 'list', description: 'List all trips' },
  { resource: 'trip', action: 'start', description: 'Start a trip' },
  { resource: 'trip', action: 'complete', description: 'Complete a trip' },
  { resource: 'trip', action: 'track', description: 'Track trip progress' },

  // Driver Management
  { resource: 'driver', action: 'create', description: 'Register new drivers' },
  { resource: 'driver', action: 'read', description: 'View driver details' },
  { resource: 'driver', action: 'update', description: 'Update driver information' },
  { resource: 'driver', action: 'delete', description: 'Remove drivers' },
  { resource: 'driver', action: 'list', description: 'List all drivers' },
  { resource: 'driver', action: 'assign', description: 'Assign drivers to trips' },

  // Payment Management
  { resource: 'payment', action: 'create', description: 'Initiate payments' },
  { resource: 'payment', action: 'read', description: 'View payment details' },
  { resource: 'payment', action: 'update', description: 'Update payment information' },
  { resource: 'payment', action: 'delete', description: 'Cancel payments' },
  { resource: 'payment', action: 'list', description: 'List all payments' },
  { resource: 'payment', action: 'approve', description: 'Approve payments' },
  { resource: 'payment', action: 'reject', description: 'Reject payments' },

  // Tenant Management
  { resource: 'tenant', action: 'create', description: 'Create new tenants' },
  { resource: 'tenant', action: 'read', description: 'View tenant details' },
  { resource: 'tenant', action: 'update', description: 'Update tenant information' },
  { resource: 'tenant', action: 'delete', description: 'Delete tenants' },
  { resource: 'tenant', action: 'list', description: 'List all tenants' },
  { resource: 'tenant', action: 'suspend', description: 'Suspend tenant accounts' },

  // Subscription Management
  { resource: 'subscription', action: 'create', description: 'Create subscriptions' },
  { resource: 'subscription', action: 'read', description: 'View subscription details' },
  { resource: 'subscription', action: 'update', description: 'Update subscriptions' },
  { resource: 'subscription', action: 'delete', description: 'Cancel subscriptions' },
  { resource: 'subscription', action: 'list', description: 'List all subscriptions' },

  // Credit Management
  { resource: 'credit', action: 'grant', description: 'Grant credits to users' },
  { resource: 'credit', action: 'revoke', description: 'Revoke credits from users' },
  { resource: 'credit', action: 'view', description: 'View credit balances' },
  { resource: 'credit', action: 'manage', description: 'Manage credit system' },

  // Permission Management
  { resource: 'permission', action: 'create', description: 'Create new permissions' },
  { resource: 'permission', action: 'read', description: 'View permissions' },
  { resource: 'permission', action: 'update', description: 'Update permissions' },
  { resource: 'permission', action: 'delete', description: 'Delete permissions' },
  { resource: 'permission', action: 'list', description: 'List all permissions' },
  { resource: 'permission', action: 'assign', description: 'Assign permissions to roles' },
  { resource: 'permission', action: 'revoke', description: 'Revoke permissions from roles' },

  // Role Management
  { resource: 'role', action: 'create', description: 'Create new roles' },
  { resource: 'role', action: 'read', description: 'View role details' },
  { resource: 'role', action: 'update', description: 'Update roles' },
  { resource: 'role', action: 'delete', description: 'Delete roles' },
  { resource: 'role', action: 'list', description: 'List all roles' },
  { resource: 'role', action: 'assign', description: 'Assign roles to users' },
  { resource: 'role', action: 'revoke', description: 'Revoke roles from users' },

  // Report Management
  { resource: 'report', action: 'create', description: 'Generate reports' },
  { resource: 'report', action: 'read', description: 'View reports' },
  { resource: 'report', action: 'list', description: 'List all reports' },
  { resource: 'report', action: 'export', description: 'Export reports' },

  // Settings Management
  { resource: 'settings', action: 'read', description: 'View system settings' },
  { resource: 'settings', action: 'update', description: 'Update system settings' },

  // Analytics
  { resource: 'analytics', action: 'view', description: 'View analytics dashboard' },
  { resource: 'analytics', action: 'export', description: 'Export analytics data' },
];

// Default roles
const roles = [
  { name: 'SUPER_ADMIN', description: 'Super administrator with full system access' },
  { name: 'ADMIN', description: 'Administrator with operational access' },
  { name: 'TENANT_ADMIN', description: 'Tenant administrator' },
  { name: 'CARGO_OWNER', description: 'Cargo owner role' },
  { name: 'TRUCK_OWNER', description: 'Truck owner role' },
  { name: 'DRIVER', description: 'Driver role' },
  { name: 'BROKER', description: 'Broker role' },
  { name: 'AGENT', description: 'Agent role' },
  { name: 'LENDER', description: 'Lender role' },
  { name: 'CARGO_RECEIVER', description: 'Cargo receiver role' },
  { name: 'CUSTOMS_OFFICER', description: 'Customs officer role' },
];

async function seedPermissions() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Begin transaction
    await client.query('BEGIN');

    // 1. Seed permissions
    console.log('\n📝 Seeding permissions...');
    let permissionCount = 0;
    const permissionIds = {};

    for (const perm of permissions) {
      const permName = `${perm.resource}:${perm.action}`;
      const result = await client.query(
        `INSERT INTO permissions (name, resource, action, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE 
         SET description = EXCLUDED.description, updated_at = NOW()
         RETURNING id`,
        [permName, perm.resource, perm.action, perm.description]
      );
      permissionIds[permName] = result.rows[0].id;
      permissionCount++;
    }
    console.log(`✅ Seeded ${permissionCount} permissions`);

    // 2. Seed roles
    console.log('\n👥 Seeding roles...');
    let roleCount = 0;
    const roleIds = {};

    for (const role of roles) {
      const result = await client.query(
        `INSERT INTO roles (name, description, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE 
         SET description = EXCLUDED.description, updated_at = NOW()
         RETURNING id`,
        [role.name, role.description]
      );
      roleIds[role.name] = result.rows[0].id;
      roleCount++;
    }
    console.log(`✅ Seeded ${roleCount} roles`);

    // 3. Assign all permissions to SUPER_ADMIN
    console.log('\n🔐 Assigning all permissions to SUPER_ADMIN...');
    const superAdminId = roleIds['SUPER_ADMIN'];
    let assignedCount = 0;

    for (const permId of Object.values(permissionIds)) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [superAdminId, permId]
      );
      assignedCount++;
    }
    console.log(`✅ Assigned ${assignedCount} permissions to SUPER_ADMIN`);

    // 4. Assign basic permissions to ADMIN
    console.log('\n🔐 Assigning permissions to ADMIN...');
    const adminId = roleIds['ADMIN'];
    const adminPermissions = [
      'user:read', 'user:list', 'user:update',
      'cargo:create', 'cargo:read', 'cargo:update', 'cargo:list', 'cargo:assign',
      'truck:read', 'truck:list', 'truck:assign',
      'trip:create', 'trip:read', 'trip:update', 'trip:list', 'trip:start', 'trip:complete',
      'driver:read', 'driver:list', 'driver:assign',
      'payment:read', 'payment:list', 'payment:approve',
      'report:create', 'report:read', 'report:list',
      'analytics:view',
    ];

    let adminAssignedCount = 0;
    for (const permName of adminPermissions) {
      if (permissionIds[permName]) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [adminId, permissionIds[permName]]
        );
        adminAssignedCount++;
      }
    }
    console.log(`✅ Assigned ${adminAssignedCount} permissions to ADMIN`);

    // Commit transaction
    await client.query('COMMIT');

    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Permission seeding completed successfully!');
    console.log('='.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`   • Total Permissions: ${permissionCount}`);
    console.log(`   • Total Roles: ${roleCount}`);
    console.log(`   • SUPER_ADMIN Permissions: ${assignedCount}`);
    console.log(`   • ADMIN Permissions: ${adminAssignedCount}`);
    console.log('\n✅ You can now assign permissions to other roles via the Admin UI\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed
seedPermissions()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
