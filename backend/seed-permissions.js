#!/usr/bin/env node
/**
 * Production-ready permission catalog seeder.
 *
 * Adapts to real DB schema (legacy TypeORM vs base_schema):
 *   - name NOT NULL UNIQUE  → set as "resource:action"
 *   - created_at vs "createdAt" / "updatedAt"
 *   - lookup by name or (resource, action)
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
  { resource: 'cargo', action: 'create', category: 'cargo', description: 'Create new cargo loads' },
  { resource: 'cargo', action: 'view', category: 'cargo', description: 'View cargo loads' },
  { resource: 'bids', action: 'create', category: 'bidding', description: 'Place bids' },
  { resource: 'bids', action: 'manage', category: 'bidding', description: 'Accept or reject bids' },
  { resource: 'matching', action: 'request', category: 'matching', description: 'Use Smart Matching' },
  { resource: 'trips', action: 'start', category: 'trip', description: 'Start a trip' },
  { resource: 'analytics', action: 'view_own', category: 'analytics', description: 'View own analytics' },
];

const FALLBACK_ROLE_DEFAULTS = {
  CARGO_OWNER: [
    'cargo:view', 'cargo:create', 'cargo:edit', 'cargo:publish',
    'auctions:create', 'bids:view', 'bids:manage', 'matching:request', 'matching:view_results',
    'analytics:view_own',
  ],
  TRUCK_OWNER: [
    'fleet:view', 'fleet:create', 'bids:create', 'matching:respond',
    'trips:start', 'trips:complete', 'analytics:view_own',
  ],
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

  console.warn('⚠️  permission-catalog.json not found — using embedded fallback');
  return { permissions: FALLBACK_PERMISSIONS, roleDefaults: FALLBACK_ROLE_DEFAULTS };
}

async function getPermissionColumns(client) {
  const rows = await client.query(
    `
    SELECT column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permissions'
    `,
  );
  const map = new Map();
  for (const r of rows.rows) {
    map.set(r.column_name, r);
  }
  return map;
}

function pickCol(columns, candidates) {
  for (const c of candidates) {
    if (columns.has(c)) return c;
  }
  return null;
}

async function ensureMinimalSchema(client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

  await client.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(150) UNIQUE NOT NULL,
      resource varchar(100) NOT NULL,
      action varchar(100) NOT NULL,
      description text,
      category varchar(100),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(100) UNIQUE NOT NULL,
      description text,
      is_system boolean DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(async () => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) UNIQUE NOT NULL,
        description text,
        is_system boolean DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  });

  await client.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id uuid,
      role varchar(100),
      permission_id uuid NOT NULL,
      granted_at TIMESTAMP DEFAULT now()
    )
  `).catch(() => {});
}

/**
 * Schema-aware upsert for production + legacy permission tables.
 */
async function upsertPermission(client, columns, perm) {
  const resource = String(perm.resource || '').trim();
  const action = String(perm.action || '').trim();
  const category = String(perm.category || 'other').trim();
  const description = String(perm.description || '').trim();
  if (!resource || !action) return false;

  const name = `${resource}:${action}`;
  if (name.length > 150) {
    throw new Error(`Permission name too long: ${name}`);
  }

  const hasName = columns.has('name');
  const createdAtCol = pickCol(columns, ['createdAt', 'created_at']);
  const updatedAtCol = pickCol(columns, ['updatedAt', 'updated_at']);

  // Find existing by name first (prod unique key), then resource+action
  let existing;
  if (hasName) {
    existing = await client.query(`SELECT id FROM permissions WHERE name = $1 LIMIT 1`, [name]);
  }
  if (!existing?.rows?.length) {
    existing = await client.query(
      `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
      [resource, action],
    );
  }

  if (existing.rows.length) {
    const sets = ['resource = $1', 'action = $2', 'category = $3', 'description = $4'];
    const params = [resource, action, category, description];
    if (hasName) {
      sets.push(`name = $${params.length + 1}`);
      params.push(name);
    }
    if (updatedAtCol) {
      sets.push(`"${updatedAtCol}" = NOW()`);
    }
    params.push(existing.rows[0].id);
    await client.query(
      `UPDATE permissions SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params,
    );
    return true;
  }

  // INSERT — only include columns that exist
  const cols = ['resource', 'action'];
  const vals = ['$1', '$2'];
  const params = [resource, action];

  if (hasName) {
    cols.push('name');
    vals.push(`$${params.length + 1}`);
    params.push(name);
  }
  if (columns.has('category')) {
    cols.push('category');
    vals.push(`$${params.length + 1}`);
    params.push(category);
  }
  if (columns.has('description')) {
    cols.push('description');
    vals.push(`$${params.length + 1}`);
    params.push(description);
  }
  if (createdAtCol) {
    cols.push(`"${createdAtCol}"`);
    vals.push('NOW()');
  }
  if (updatedAtCol) {
    cols.push(`"${updatedAtCol}"`);
    vals.push('NOW()');
  }

  // Quote identifiers that need it (camelCase)
  const quotedCols = cols.map((c) => (c.startsWith('"') ? c : `"${c}"`));

  await client.query(
    `INSERT INTO permissions (${quotedCols.join(', ')}) VALUES (${vals.join(', ')})`,
    params,
  );
  return true;
}

async function upsertRole(client, name, description) {
  const existing = await client.query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [name]);
  if (existing.rows.length) {
    await client.query(
      `UPDATE roles SET description = $1 WHERE id = $2`,
      [description, existing.rows[0].id],
    ).catch(() => {});
    return existing.rows[0].id;
  }

  // Try camelCase timestamps first, then snake_case
  try {
    const r = await client.query(
      `INSERT INTO roles (name, description, is_system, "createdAt", "updatedAt")
       VALUES ($1, $2, true, NOW(), NOW()) RETURNING id`,
      [name, description],
    );
    return r.rows[0].id;
  } catch {
    try {
      const r = await client.query(
        `INSERT INTO roles (name, description, is_system, created_at, updated_at)
         VALUES ($1, $2, true, NOW(), NOW()) RETURNING id`,
        [name, description],
      );
      return r.rows[0].id;
    } catch {
      const r = await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`,
        [name, description],
      );
      return r.rows[0].id;
    }
  }
}

async function getRolePermissionColumns(client) {
  const cols = await client.query(
    `
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
    `,
  );
  const map = new Map();
  for (const r of cols.rows) {
    map.set(r.column_name, r.is_nullable === 'YES');
  }
  return map;
}

/**
 * Production DB often has BOTH role_id and role (varchar NOT NULL).
 * Insert whichever columns exist / are required.
 */
async function linkRolePermission(client, rpCols, roleName, permissionId) {
  const hasRoleId = rpCols.has('role_id');
  const hasRole = rpCols.has('role');
  const roleNullable = rpCols.get('role') === true;

  let roleId = null;
  if (hasRoleId) {
    const role = await client.query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [roleName]);
    if (!role.rows.length) {
      // Still can link via varchar role if available
      if (!hasRole) return false;
    } else {
      roleId = role.rows[0].id;
    }
  }

  // Already linked?
  if (hasRoleId && roleId) {
    const existing = await client.query(
      `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1`,
      [roleId, permissionId],
    );
    if (existing.rows.length) return false;
  } else if (hasRole) {
    const existing = await client.query(
      `SELECT 1 FROM role_permissions WHERE role = $1 AND permission_id = $2 LIMIT 1`,
      [roleName, permissionId],
    );
    if (existing.rows.length) return false;
  }

  // Build insert for hybrid schema
  if (hasRoleId && hasRole) {
    if (!roleId && !roleNullable) {
      // role required but no roles row — insert varchar only if role_id nullable
      const roleIdNullable = rpCols.get('role_id') === true;
      if (!roleIdNullable) return false;
      await client.query(
        `INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)`,
        [roleName, permissionId],
      );
      return true;
    }
    await client.query(
      `INSERT INTO role_permissions (role_id, role, permission_id) VALUES ($1, $2, $3)`,
      [roleId, roleName, permissionId],
    );
    return true;
  }

  if (hasRoleId && roleId) {
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
      [roleId, permissionId],
    );
    return true;
  }

  if (hasRole) {
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
    await ensureMinimalSchema(client);
    const columns = await getPermissionColumns(client);
    console.log(
      `🧭 permissions columns: ${[...columns.keys()].sort().join(', ')}`,
    );
    if (!columns.has('name')) {
      console.warn(
        '⚠️  Column "name" missing — inserts will omit it (legacy schema).',
      );
    } else {
      console.log('✅ Will set name = resource:action (required on this DB)');
    }

    let upserted = 0;
    let failed = 0;
    for (const perm of permissions) {
      try {
        const ok = await upsertPermission(client, columns, perm);
        if (ok) upserted += 1;
      } catch (err) {
        failed += 1;
        console.warn(`⚠️  Failed ${perm.resource}:${perm.action} — ${err.message}`);
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

    const rpCols = await getRolePermissionColumns(client);
    console.log(
      `🧭 role_permissions columns: ${[...rpCols.keys()].sort().join(', ')}`,
    );

    let roleLinks = 0;
    for (const [roleName, codes] of Object.entries(roleDefaults || {})) {
      for (const code of codes) {
        try {
          const [resource, action] = String(code).split(':');
          let perm = await client.query(
            `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
            [code],
          ).catch(() => ({ rows: [] }));
          if (!perm.rows.length) {
            perm = await client.query(
              `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
              [resource, action],
            );
          }
          if (!perm.rows.length) continue;
          const linked = await linkRolePermission(
            client,
            rpCols,
            roleName,
            perm.rows[0].id,
          );
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
