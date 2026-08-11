#!/usr/bin/env node
/**
 * Seed / upsert enterprise permission catalog into the database.
 *
 * Run:
 *   node seed-permissions.js
 *   docker compose -f docker-compose.production.yml exec backend node seed-permissions.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const FALLBACK_PERMISSIONS = [
  { resource: 'cargo', action: 'view', category: 'cargo', description: 'View cargo loads' },
  { resource: 'cargo', action: 'view_own', category: 'cargo', description: 'View own cargo loads' },
  { resource: 'cargo', action: 'create', category: 'cargo', description: 'Create new cargo loads' },
  { resource: 'cargo', action: 'edit', category: 'cargo', description: 'Edit cargo loads' },
  { resource: 'cargo', action: 'delete', category: 'cargo', description: 'Delete cargo loads' },
  { resource: 'cargo', action: 'publish', category: 'cargo', description: 'Publish cargo for bidding or matching' },
  { resource: 'fleet', action: 'view', category: 'truck', description: 'View trucks' },
  { resource: 'fleet', action: 'create', category: 'truck', description: 'Register / create trucks' },
  { resource: 'fleet', action: 'edit', category: 'truck', description: 'Edit truck details' },
  { resource: 'auctions', action: 'view', category: 'bidding', description: 'View auctions' },
  { resource: 'auctions', action: 'create', category: 'bidding', description: 'Create auctions' },
  { resource: 'bids', action: 'view', category: 'bidding', description: 'View bids' },
  { resource: 'bids', action: 'create', category: 'bidding', description: 'Place bids' },
  { resource: 'bids', action: 'manage', category: 'bidding', description: 'Accept or reject bids' },
  { resource: 'matching', action: 'request', category: 'matching', description: 'Use Smart Matching' },
  { resource: 'matching', action: 'respond', category: 'matching', description: 'Respond to Smart Matching' },
  { resource: 'matching', action: 'view_results', category: 'matching', description: 'View Smart Matching results' },
  { resource: 'trips', action: 'view', category: 'trip', description: 'View trips' },
  { resource: 'trips', action: 'start', category: 'trip', description: 'Start a trip' },
  { resource: 'trips', action: 'complete', category: 'trip', description: 'Complete a trip' },
  { resource: 'lending', action: 'create_request', category: 'lending', description: 'Create loan request' },
  { resource: 'lending', action: 'approve', category: 'lending', description: 'Approve loans' },
  { resource: 'analytics', action: 'view_own', category: 'analytics', description: 'View own analytics' },
  { resource: 'analytics', action: 'view_tenant', category: 'analytics', description: 'View tenant analytics' },
  { resource: 'analytics', action: 'view_all', category: 'analytics', description: 'View platform analytics' },
  { resource: 'analytics', action: 'financial', category: 'analytics', description: 'View financial analytics' },
  { resource: 'analytics', action: 'cost_trends', category: 'analytics', description: 'View cost trends' },
  { resource: 'reports', action: 'view', category: 'analytics', description: 'View reports' },
  { resource: 'reports', action: 'export', category: 'analytics', description: 'Export reports' },
  { resource: 'users', action: 'permissions.manage', category: 'users', description: 'Manage user permissions' },
];

const FALLBACK_ROLE_DEFAULTS = {
  CARGO_OWNER: [
    'cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit', 'cargo:delete', 'cargo:publish',
    'auctions:view', 'auctions:create', 'bids:view', 'bids:manage',
    'matching:request', 'matching:view_results', 'lending:create_request',
    'trips:view', 'analytics:view_own', 'analytics:view_tenant',
  ],
  TRUCK_OWNER: [
    'fleet:view', 'fleet:create', 'fleet:edit',
    'auctions:view', 'bids:view', 'bids:create',
    'matching:respond', 'trips:view', 'trips:start', 'trips:complete',
    'lending:create_request', 'analytics:view_own',
  ],
  DRIVER: ['trips:view', 'trips:start', 'trips:complete', 'analytics:view_own'],
  LENDER: ['lending:approve', 'analytics:view_own'],
  BROKER: ['auctions:view', 'bids:view', 'bids:manage', 'matching:request', 'cargo:view'],
  TENANT_ADMIN: ['cargo:view', 'fleet:view', 'bids:manage', 'matching:view_results', 'analytics:view_tenant'],
};

function loadCatalog() {
  const candidates = [
    path.join(__dirname, 'config', 'permission-catalog.json'),
    path.join(__dirname, 'dist', 'config', 'permission-catalog.json'),
    path.join(__dirname, 'src', 'config', 'permission-catalog.json'),
    path.join(process.cwd(), 'config', 'permission-catalog.json'),
    path.join(process.cwd(), 'dist', 'config', 'permission-catalog.json'),
    path.join(process.cwd(), 'src', 'config', 'permission-catalog.json'),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(parsed.permissions) || !parsed.permissions.length) continue;
      console.log(`📄 Loaded catalog from ${filePath} (${parsed.permissions.length} permissions)`);
      return {
        permissions: parsed.permissions,
        roleDefaults: parsed.roleDefaults || FALLBACK_ROLE_DEFAULTS,
      };
    } catch (err) {
      console.warn(`⚠️  Failed reading ${filePath}:`, err.message);
    }
  }

  console.warn('⚠️  permission-catalog.json not found — using embedded fallback catalog');
  return { permissions: FALLBACK_PERMISSIONS, roleDefaults: FALLBACK_ROLE_DEFAULTS };
}

async function ensureSchema(client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

  await client.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      resource varchar(100) NOT NULL,
      action varchar(50) NOT NULL,
      description text,
      category varchar(50),
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  // Deduplicate before unique index (older DBs may have duplicate resource+action)
  await client.query(`
    DELETE FROM permissions a
    USING permissions b
    WHERE a.ctid < b.ctid
      AND a.resource = b.resource
      AND a.action = b.action
  `).catch((err) => {
    console.warn('⚠️  Deduplicate permissions skipped:', err.message);
  });

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_permissions_resource_action"
    ON permissions (resource, action)
  `).catch((err) => {
    console.warn('⚠️  Unique index on permissions skipped:', err.message);
  });

  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name varchar(100) NOT NULL,
      description text,
      is_system boolean NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_roles_name" ON roles (name)`).catch(() => {});

  await client.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      role_id uuid,
      role varchar(100),
      permission_id uuid NOT NULL,
      granted_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
}

/** Safe upsert without relying on ON CONFLICT (works even if unique constraint is missing). */
async function upsertPermission(client, perm) {
  const resource = String(perm.resource || '').trim();
  const action = String(perm.action || '').trim();
  const category = String(perm.category || 'other').trim();
  const description = String(perm.description || '').trim();
  if (!resource || !action) return false;

  const existing = await client.query(
    `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
    [resource, action],
  );

  if (existing.rows.length) {
    await client.query(
      `UPDATE permissions SET category = $1, description = $2 WHERE id = $3`,
      [category, description, existing.rows[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO permissions (resource, action, category, description) VALUES ($1, $2, $3, $4)`,
      [resource, action, category, description],
    );
  }
  return true;
}

async function upsertRole(client, name, description) {
  const existing = await client.query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [name]);
  if (existing.rows.length) {
    await client.query(
      `UPDATE roles SET description = $1, updated_at = NOW() WHERE id = $2`,
      [description, existing.rows[0].id],
    );
    return existing.rows[0].id;
  }
  const inserted = await client.query(
    `INSERT INTO roles (name, description, is_system) VALUES ($1, $2, true) RETURNING id`,
    [name, description],
  );
  return inserted.rows[0].id;
}

async function linkRolePermission(client, colNames, roleName, permissionId) {
  if (colNames.has('role_id')) {
    const role = await client.query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [roleName]);
    if (!role.rows.length) return false;
    const roleId = role.rows[0].id;
    const existing = await client.query(
      `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1`,
      [roleId, permissionId],
    );
    if (existing.rows.length) return false;
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
      [roleId, permissionId],
    );
    return true;
  }

  if (colNames.has('role')) {
    const existing = await client.query(
      `SELECT 1 FROM role_permissions WHERE role = $1 AND permission_id = $2 LIMIT 1`,
      [roleName, permissionId],
    );
    if (existing.rows.length) return false;
    await client.query(
      `INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)`,
      [roleName, permissionId],
    );
    return true;
  }

  return false;
}

async function seed() {
  const { permissions, roleDefaults } = loadCatalog();
  const client = new Client(config);

  console.log('🔌 Connecting to database:', config.host, config.database);
  await client.connect();
  console.log('✅ Connected');

  try {
    // No single outer transaction — one failed statement must not abort the rest
    await ensureSchema(client);

    let upserted = 0;
    let failed = 0;
    for (const perm of permissions) {
      try {
        const ok = await upsertPermission(client, perm);
        if (ok) upserted += 1;
      } catch (err) {
        failed += 1;
        console.warn(
          `⚠️  Failed ${perm.resource}:${perm.action} — ${err.message}`,
        );
      }
    }
    console.log(`✅ Upserted ${upserted} permissions${failed ? ` (${failed} failed)` : ''}`);

    const systemRoles = [
      ['SUPER_ADMIN', 'Full system access across all tenants'],
      ['ADMIN', 'Tenant-level administrative access'],
      ['TENANT_ADMIN', 'Tenant workspace administrator access'],
      ['CARGO_OWNER', 'Cargo owner operational access'],
      ['CARGO_RECEIVER', 'Cargo receiver access'],
      ['TRUCK_OWNER', 'Truck fleet management access'],
      ['DRIVER', 'Driver operational access'],
      ['BROKER', 'Broker intermediary access'],
      ['LENDER', 'Financial lending access'],
      ['AGENT', 'Agent coordination access'],
      ['CUSTOMS_OFFICER', 'Customs inspection access'],
      ['FLEET_MANAGER', 'Fleet management operational access'],
      ['FLEET_DISPATCHER', 'Fleet dispatch operational access'],
    ];

    for (const [name, description] of systemRoles) {
      try {
        await upsertRole(client, name, description);
      } catch (err) {
        console.warn(`⚠️  Role ${name}: ${err.message}`);
      }
    }

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'role_permissions'
         AND column_name IN ('role', 'role_id')`,
    );
    const colNames = new Set(cols.rows.map((r) => r.column_name));

    let roleLinks = 0;
    for (const [roleName, codes] of Object.entries(roleDefaults || {})) {
      for (const code of codes) {
        try {
          const [resource, action] = String(code).split(':');
          const perm = await client.query(
            `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
            [resource, action],
          );
          if (!perm.rows.length) continue;
          const linked = await linkRolePermission(client, colNames, roleName, perm.rows[0].id);
          if (linked) roleLinks += 1;
        } catch (err) {
          console.warn(`⚠️  Link ${roleName} → ${code}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Linked ${roleLinks} new role-permission defaults`);

    const count = await client.query(`SELECT COUNT(*)::int AS count FROM permissions`);
    const byCat = await client.query(
      `SELECT COALESCE(category, 'null') AS category, COUNT(*)::int AS count
       FROM permissions GROUP BY 1 ORDER BY 2 DESC`,
    );

    console.log('\n========================================');
    console.log(`🎉 Permission catalog ready — ${count.rows[0].count} total in DB`);
    console.log('========================================');
    for (const row of byCat.rows) {
      console.log(`   • ${row.category}: ${row.count}`);
    }
    console.log('');

    if (count.rows[0].count < 20) {
      throw new Error(`Only ${count.rows[0].count} permissions in DB — seed incomplete`);
    }
  } finally {
    await client.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  });
