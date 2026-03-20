/**
 * Add Analytics Permissions
 * 
 * Adds the necessary permissions for the analytics system
 */

const { Client } = require('pg');
require('dotenv').config();

async function addAnalyticsPermissions() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Define analytics permissions
    const analyticsPermissions = [
      {
        name: 'analytics:view',
        description: 'View analytics data and reports',
        category: 'analytics'
      },
      {
        name: 'analytics:insights',
        description: 'View and manage AI-generated insights',
        category: 'analytics'
      },
      {
        name: 'analytics:admin',
        description: 'Admin-level analytics operations (backfill, etc.)',
        category: 'analytics'
      },
      {
        name: 'analytics:export',
        description: 'Export analytics data and reports',
        category: 'analytics'
      }
    ];

    console.log('\n📋 Adding Analytics Permissions...');
    console.log('=====================================');

    for (const permission of analyticsPermissions) {
      try {
        // Check if permission already exists
        const existingResult = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permission.name]
        );

        if (existingResult.rows.length > 0) {
          console.log(`⚠️  Permission "${permission.name}" already exists`);
          continue;
        }

        // Insert new permission
        const result = await client.query(`
          INSERT INTO permissions (name, description, category, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id, name
        `, [permission.name, permission.description, permission.category]);

        console.log(`✅ Added permission: ${result.rows[0].name}`);
      } catch (error) {
        console.error(`❌ Failed to add permission "${permission.name}":`, error.message);
      }
    }

    // Assign analytics permissions to roles
    console.log('\n📋 Assigning Permissions to Roles...');
    console.log('====================================');

    const rolePermissions = [
      // SUPER_ADMIN gets all analytics permissions
      { role: 'SUPER_ADMIN', permissions: ['analytics:view', 'analytics:insights', 'analytics:admin', 'analytics:export'] },
      // ADMIN gets most analytics permissions
      { role: 'ADMIN', permissions: ['analytics:view', 'analytics:insights', 'analytics:export'] },
      // CARGO_OWNER gets view and insights permissions
      { role: 'CARGO_OWNER', permissions: ['analytics:view', 'analytics:insights'] },
      // TRUCK_OWNER gets view permissions
      { role: 'TRUCK_OWNER', permissions: ['analytics:view'] },
      // BROKER gets view permissions
      { role: 'BROKER', permissions: ['analytics:view'] },
    ];

    for (const rolePermission of rolePermissions) {
      for (const permissionName of rolePermission.permissions) {
        try {
          // Get permission ID
          const permissionResult = await client.query(
            'SELECT id FROM permissions WHERE name = $1',
            [permissionName]
          );

          if (permissionResult.rows.length === 0) {
            console.log(`⚠️  Permission "${permissionName}" not found`);
            continue;
          }

          const permissionId = permissionResult.rows[0].id;

          // Check if role-permission already exists
          const existingRolePermission = await client.query(
            'SELECT id FROM role_permissions WHERE role = $1 AND permission_id = $2',
            [rolePermission.role, permissionId]
          );

          if (existingRolePermission.rows.length > 0) {
            console.log(`⚠️  ${rolePermission.role} already has ${permissionName}`);
            continue;
          }

          // Insert role-permission
          await client.query(`
            INSERT INTO role_permissions (role, permission_id, granted_at, granted_by)
            VALUES ($1, $2, NOW(), $3)
          `, [rolePermission.role, permissionId, 'a5a937f5-15e9-48d5-a729-aaaca9072731']); // Admin user ID

          console.log(`✅ Assigned ${permissionName} to ${rolePermission.role}`);
        } catch (error) {
          console.error(`❌ Failed to assign ${permissionName} to ${rolePermission.role}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Analytics permissions setup complete!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

addAnalyticsPermissions();