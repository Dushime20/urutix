import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';

export type CatalogPermission = {
  resource: string;
  action: string;
  category: string;
  description: string;
};

type PermissionCatalogFile = {
  version?: number;
  permissions: CatalogPermission[];
  roleDefaults?: Record<string, string[]>;
};

/** Fallback if JSON asset is missing at runtime (dev / misconfigured build) */
const FALLBACK_CATALOG: CatalogPermission[] = [
  { resource: 'cargo', action: 'view', category: 'cargo', description: 'View cargo loads' },
  { resource: 'cargo', action: 'view_own', category: 'cargo', description: 'View own cargo loads' },
  { resource: 'cargo', action: 'create', category: 'cargo', description: 'Create new cargo loads' },
  { resource: 'cargo', action: 'edit', category: 'cargo', description: 'Edit cargo loads' },
  { resource: 'cargo', action: 'delete', category: 'cargo', description: 'Delete cargo loads' },
  { resource: 'cargo', action: 'publish', category: 'cargo', description: 'Publish cargo for bidding or matching' },
  { resource: 'cargo', action: 'approve', category: 'cargo', description: 'Approve or reject cargo loads' },
  { resource: 'cargo', action: 'assign_receiver', category: 'cargo', description: 'Assign receiver to cargo' },
  { resource: 'fleet', action: 'view', category: 'truck', description: 'View trucks' },
  { resource: 'fleet', action: 'view_own', category: 'truck', description: 'View own trucks' },
  { resource: 'fleet', action: 'create', category: 'truck', description: 'Register / create trucks' },
  { resource: 'fleet', action: 'edit', category: 'truck', description: 'Edit truck details' },
  { resource: 'fleet', action: 'delete', category: 'truck', description: 'Delete trucks' },
  { resource: 'fleet', action: 'assign_driver', category: 'truck', description: 'Assign driver to truck' },
  { resource: 'drivers', action: 'view', category: 'driver', description: 'View drivers' },
  { resource: 'drivers', action: 'view_own', category: 'driver', description: 'View own driver profile' },
  { resource: 'drivers', action: 'create', category: 'driver', description: 'Create drivers' },
  { resource: 'drivers', action: 'edit', category: 'driver', description: 'Edit drivers' },
  { resource: 'drivers', action: 'delete', category: 'driver', description: 'Delete drivers' },
  { resource: 'auctions', action: 'view', category: 'bidding', description: 'View auctions' },
  { resource: 'auctions', action: 'create', category: 'bidding', description: 'Create auctions / publish for bid' },
  { resource: 'auctions', action: 'manage', category: 'bidding', description: 'Manage auction lifecycle' },
  { resource: 'bids', action: 'view', category: 'bidding', description: 'View bids' },
  { resource: 'bids', action: 'view_own', category: 'bidding', description: 'View own bids' },
  { resource: 'bids', action: 'create', category: 'bidding', description: 'Place bids on cargo' },
  { resource: 'bids', action: 'manage', category: 'bidding', description: 'Accept or reject bids' },
  { resource: 'bids', action: 'view_history', category: 'bidding', description: 'View bid history' },
  { resource: 'matching', action: 'request', category: 'matching', description: 'Use Smart Matching (find / request)' },
  { resource: 'matching', action: 'respond', category: 'matching', description: 'Respond to Smart Matching requests' },
  { resource: 'matching', action: 'view_results', category: 'matching', description: 'View Smart Matching results' },
  { resource: 'matching', action: 'analytics', category: 'matching', description: 'View matching analytics' },
  { resource: 'trips', action: 'view', category: 'trip', description: 'View trips' },
  { resource: 'trips', action: 'view_assigned', category: 'trip', description: 'View assigned trips' },
  { resource: 'trips', action: 'create', category: 'trip', description: 'Create trips' },
  { resource: 'trips', action: 'start', category: 'trip', description: 'Start a trip' },
  { resource: 'trips', action: 'complete', category: 'trip', description: 'Complete a trip' },
  { resource: 'trips', action: 'pause', category: 'trip', description: 'Pause a trip' },
  { resource: 'trips', action: 'resume', category: 'trip', description: 'Resume a trip' },
  { resource: 'trips', action: 'cancel', category: 'trip', description: 'Cancel a trip' },
  { resource: 'trips', action: 'assign_driver', category: 'trip', description: 'Assign driver to trip' },
  { resource: 'trips', action: 'track', category: 'trip', description: 'Track trip location' },
  { resource: 'trips', action: 'view_epod', category: 'trip', description: 'View ePOD' },
  { resource: 'trips', action: 'confirm_epod', category: 'trip', description: 'Confirm ePOD' },
  { resource: 'lending', action: 'view', category: 'lending', description: 'View lending dashboard' },
  { resource: 'lending', action: 'view_own', category: 'lending', description: 'View own loan requests' },
  { resource: 'lending', action: 'create_request', category: 'lending', description: 'Create loan / financing request' },
  { resource: 'lending', action: 'approve', category: 'lending', description: 'Approve or reject loan requests' },
  { resource: 'lending', action: 'disburse', category: 'lending', description: 'Disburse loans' },
  { resource: 'lending', action: 'repayment', category: 'lending', description: 'Manage repayments' },
  { resource: 'lending', action: 'policies', category: 'lending', description: 'Manage lending policies' },
  { resource: 'brokers', action: 'view', category: 'broker', description: 'View brokers' },
  { resource: 'brokers', action: 'assign', category: 'broker', description: 'Assign broker to cargo' },
  { resource: 'brokers', action: 'create', category: 'broker', description: 'Create broker accounts' },
  { resource: 'customs', action: 'view', category: 'customs', description: 'View customs inspections' },
  { resource: 'customs', action: 'create', category: 'customs', description: 'Create customs inspections' },
  { resource: 'customs', action: 'update', category: 'customs', description: 'Update customs status' },
  { resource: 'receivers', action: 'view', category: 'inspection', description: 'View receivers' },
  { resource: 'receivers', action: 'inspect', category: 'inspection', description: 'Submit cargo inspection' },
  { resource: 'payments', action: 'view', category: 'financial', description: 'View payments' },
  { resource: 'payments', action: 'view_own', category: 'financial', description: 'View own payments' },
  { resource: 'payments', action: 'manage', category: 'financial', description: 'Manage payments' },
  { resource: 'invoices', action: 'view', category: 'financial', description: 'View invoices' },
  { resource: 'invoices', action: 'create', category: 'financial', description: 'Create invoices' },
  { resource: 'credits', action: 'view', category: 'credits', description: 'View credits' },
  { resource: 'credits', action: 'purchase', category: 'credits', description: 'Purchase credits' },
  { resource: 'credits', action: 'consume', category: 'credits', description: 'Consume credits' },
  { resource: 'analytics', action: 'view_own', category: 'analytics', description: 'View own analytics' },
  { resource: 'analytics', action: 'view_tenant', category: 'analytics', description: 'View tenant analytics' },
  { resource: 'analytics', action: 'view_all', category: 'analytics', description: 'View platform analytics' },
  { resource: 'analytics', action: 'financial', category: 'analytics', description: 'View financial analytics' },
  { resource: 'analytics', action: 'cost_trends', category: 'analytics', description: 'View cost trends' },
  { resource: 'reports', action: 'view', category: 'analytics', description: 'View reports' },
  { resource: 'reports', action: 'export', category: 'analytics', description: 'Export reports' },
  { resource: 'notifications', action: 'view', category: 'notifications', description: 'View notifications' },
  { resource: 'users', action: 'view_own', category: 'users', description: 'View own profile' },
  { resource: 'users', action: 'edit_own', category: 'users', description: 'Edit own profile' },
  { resource: 'users', action: 'permissions.manage', category: 'users', description: 'Manage user permissions' },
  { resource: 'parking', action: 'view', category: 'parking', description: 'View parking reservations' },
  { resource: 'parking', action: 'view_details', category: 'parking', description: 'View parking reservation details' },
  { resource: 'parking', action: 'view_own', category: 'parking', description: 'View own parking reservations' },
  { resource: 'parking', action: 'create', category: 'parking', description: 'Submit parking reservation requests' },
  { resource: 'parking', action: 'review', category: 'parking', description: 'Review parking reservations' },
  { resource: 'parking', action: 'approve', category: 'parking', description: 'Approve parking reservations' },
  { resource: 'parking', action: 'reject', category: 'parking', description: 'Reject parking reservations' },
  { resource: 'parking', action: 'request_information', category: 'parking', description: 'Request additional reservation information' },
  { resource: 'parking', action: 'cancel', category: 'parking', description: 'Cancel parking reservations' },
  { resource: 'parking', action: 'assign', category: 'parking', description: 'Assign parking reservations' },
  { resource: 'parking', action: 'add_note', category: 'parking', description: 'Add internal notes to parking reservations' },
  { resource: 'parking', action: 'export', category: 'parking', description: 'Export parking reservations' },
  { resource: 'parking', action: 'manage_capacity', category: 'parking', description: 'Manage parking facility capacity' },
  { resource: 'parking', action: 'manage_fees', category: 'parking', description: 'Configure parking reservation fees' },
  { resource: 'parking', action: 'confirm_payment', category: 'parking', description: 'Confirm or waive parking reservation payments' },
];

const FALLBACK_ROLE_DEFAULTS: Record<string, string[]> = {
  CARGO_OWNER: [
    'cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit', 'cargo:delete', 'cargo:publish',
    'auctions:view', 'auctions:create', 'bids:view', 'bids:manage',
    'matching:request', 'matching:view_results', 'lending:create_request', 'brokers:assign',
    'trips:view_assigned', 'analytics:view_own', 'analytics:view_tenant',
    'parking:create', 'parking:view_own',
  ],
  TRUCK_OWNER: [
    'fleet:view', 'fleet:view_own', 'fleet:create', 'fleet:edit', 'fleet:delete', 'fleet:assign_driver',
    'drivers:view', 'drivers:create', 'drivers:edit',
    'auctions:view', 'bids:view_own', 'bids:create', 'bids:view_history',
    'matching:respond', 'trips:view', 'trips:start', 'trips:complete', 'trips:assign_driver',
    'lending:view_own', 'lending:create_request', 'analytics:view_own',
    'parking:create', 'parking:view_own',
  ],
  DRIVER: [
    'trips:view_assigned', 'trips:start', 'trips:complete', 'trips:pause', 'trips:resume',
    'trips:view_epod', 'analytics:view_own',
    'parking:create', 'parking:view_own',
  ],
  LENDER: [
    'lending:view', 'lending:approve', 'lending:disburse', 'lending:repayment', 'lending:policies',
    'analytics:view_own',
  ],
  BROKER: [
    'auctions:view', 'bids:view', 'bids:manage', 'matching:request', 'matching:view_results',
    'brokers:view', 'cargo:view',
  ],
  TENANT_ADMIN: [
    'cargo:view', 'fleet:view', 'bids:manage', 'auctions:manage', 'brokers:assign',
    'matching:view_results', 'trips:assign_driver', 'analytics:view_tenant',
  ],
  CARGO_RECEIVER: ['receivers:inspect', 'receivers:view', 'cargo:view_own', 'trips:confirm_epod'],
  CUSTOMS_OFFICER: ['customs:view', 'customs:create', 'customs:update'],
  FLEET_MANAGER: ['fleet:view', 'fleet:edit', 'trips:assign_driver', 'trips:start', 'trips:complete'],
  FLEET_DISPATCHER: ['trips:assign_driver', 'trips:start', 'trips:complete', 'fleet:view'],
  PARKING_RESERVATION_MANAGER: [
    'parking:view', 'parking:view_details', 'parking:review', 'parking:approve',
    'parking:reject', 'parking:request_information', 'parking:cancel', 'parking:assign',
    'parking:add_note', 'parking:export', 'parking:manage_capacity', 'parking:manage_fees',
    'parking:confirm_payment',
  ],
};

/** @deprecated Use loadPermissionCatalog(). Kept for import compatibility. */
export const ENTERPRISE_PERMISSION_CATALOG: Array<[string, string, string, string]> =
  FALLBACK_CATALOG.map((p) => [p.resource, p.action, p.category, p.description]);

/**
 * PermissionTableInitService
 *
 * Source of truth: backend/src/config/permission-catalog.json
 * Runtime store: permissions / role_permissions tables (upserted on boot + sync-catalog)
 */
@Injectable()
export class PermissionTableInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionTableInitService.name);
  private catalog: CatalogPermission[] = FALLBACK_CATALOG;
  private roleDefaults: Record<string, string[]> = FALLBACK_ROLE_DEFAULTS;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      this.loadCatalogFile();
      await this.ensureTables();
      await this.ensureFeatureControlsTable();
      const synced = await this.syncPermissionCatalog();
      await this.seedRoles();
      this.logger.log(`Permission tables initialized (${synced} catalog permissions upserted)`);
    } catch (err: any) {
      this.logger.warn('Permission table init failed (non-critical):', err?.message || err);
    }
  }

  /** Load JSON catalog from dist or src (professional source of truth). */
  loadCatalogFile(): CatalogPermission[] {
    const candidates = [
      path.join(__dirname, '..', 'config', 'permission-catalog.json'),
      path.join(process.cwd(), 'dist', 'config', 'permission-catalog.json'),
      path.join(process.cwd(), 'src', 'config', 'permission-catalog.json'),
      path.join(process.cwd(), 'backend', 'src', 'config', 'permission-catalog.json'),
    ];

    for (const filePath of candidates) {
      try {
        if (!fs.existsSync(filePath)) continue;
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw) as PermissionCatalogFile;
        if (!Array.isArray(parsed.permissions) || parsed.permissions.length === 0) continue;
        this.catalog = parsed.permissions.map((p) => ({
          resource: String(p.resource).trim(),
          action: String(p.action).trim(),
          category: String(p.category || 'other').trim(),
          description: String(p.description || '').trim(),
        }));
        if (parsed.roleDefaults && typeof parsed.roleDefaults === 'object') {
          this.roleDefaults = parsed.roleDefaults;
        }
        this.logger.log(`Loaded permission catalog from ${filePath} (${this.catalog.length} entries)`);
        return this.catalog;
      } catch (err: any) {
        this.logger.warn(`Failed reading catalog ${filePath}: ${err?.message || err}`);
      }
    }

    this.logger.warn('permission-catalog.json not found — using embedded fallback catalog');
    this.catalog = FALLBACK_CATALOG;
    this.roleDefaults = FALLBACK_ROLE_DEFAULTS;
    return this.catalog;
  }

  getCatalog(): CatalogPermission[] {
    if (!this.catalog?.length) this.loadCatalogFile();
    return this.catalog;
  }

  /** True when DB is missing key operational permissions (e.g. only analytics seeded). */
  async isCatalogIncomplete(): Promise<boolean> {
    try {
      const required = ['cargo:create', 'bids:create', 'matching:request', 'trips:start', 'fleet:create'];
      for (const code of required) {
        const [resource, action] = code.split(':');
        const rows = await this.dataSource.query(
          `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
          [resource, action],
        );
        if (!rows.length) return true;
      }
      const count = await this.getPermissionCount();
      return count < Math.min(40, this.getCatalog().length);
    } catch {
      return true;
    }
  }

  /** Public — Super Admin / detail endpoint can force-refresh the catalog */
  async syncPermissionCatalog(): Promise<number> {
    this.loadCatalogFile();
    await this.ensureTables();

    const columns = await this.getPermissionColumnSet();
    const hasName = columns.has('name');
    const updatedAtCol = columns.has('updatedAt')
      ? 'updatedAt'
      : columns.has('updated_at')
        ? 'updated_at'
        : null;
    const createdAtCol = columns.has('createdAt')
      ? 'createdAt'
      : columns.has('created_at')
        ? 'created_at'
        : null;

    if (hasName) {
      this.logger.log('Permission sync: setting name=resource:action (production schema)');
    }

    let count = 0;
    for (const perm of this.getCatalog()) {
      const { resource, action, category, description } = perm;
      const name = `${resource}:${action}`;
      try {
        // Prefer lookup by name (unique in prod), else resource+action
        let existing: any[] = [];
        if (hasName) {
          existing = await this.dataSource.query(
            `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
            [name],
          );
        }
        if (!existing.length) {
          existing = await this.dataSource.query(
            `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
            [resource, action],
          );
        }

        if (existing.length) {
          const sets = [`resource = $1`, `action = $2`, `category = $3`, `description = $4`];
          const params: any[] = [resource, action, category, description];
          if (hasName) {
            sets.push(`name = $${params.length + 1}`);
            params.push(name);
          }
          if (updatedAtCol) {
            sets.push(`"${updatedAtCol}" = NOW()`);
          }
          params.push(existing[0].id);
          await this.dataSource.query(
            `UPDATE permissions SET ${sets.join(', ')} WHERE id = $${params.length}`,
            params,
          );
        } else {
          const cols: string[] = ['resource', 'action'];
          const vals: string[] = ['$1', '$2'];
          const params: any[] = [resource, action];
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
            cols.push(createdAtCol);
            vals.push('NOW()');
          }
          if (updatedAtCol) {
            cols.push(updatedAtCol);
            vals.push('NOW()');
          }
          const quoted = cols.map((c) => `"${c}"`).join(', ');
          await this.dataSource.query(
            `INSERT INTO permissions (${quoted}) VALUES (${vals.join(', ')})`,
            params,
          );
        }
        count += 1;
      } catch (err: any) {
        this.logger.warn(`Failed to upsert ${name}: ${err?.message || err}`);
      }
    }
    await this.seedRoleOperationalPermissions();
    return count;
  }

  private async getPermissionColumnSet(): Promise<Set<string>> {
    try {
      const rows = await this.dataSource.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'permissions'`,
      );
      return new Set(rows.map((r: any) => r.column_name));
    } catch {
      return new Set(['resource', 'action', 'category', 'description']);
    }
  }

  async getPermissionCount(): Promise<number> {
    try {
      const rows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM permissions`);
      return rows[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  private async ensureTables() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

    // Production-compatible schema (name is required on live DBs from 000_base_schema)
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "resource" varchar(100) NOT NULL,
        "action" varchar(100) NOT NULL,
        "description" text,
        "category" varchar(100),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // If table already exists without name (legacy), add it safely
    await this.dataSource.query(`
      ALTER TABLE permissions
        ADD COLUMN IF NOT EXISTS name varchar(150)
    `).catch(() => {});
    await this.dataSource.query(`
      UPDATE permissions
      SET name = resource || ':' || action
      WHERE name IS NULL OR name = ''
    `).catch(() => {});
    await this.dataSource.query(`
      ALTER TABLE permissions ALTER COLUMN name SET NOT NULL
    `).catch(() => {});
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_key ON permissions (name)
    `).catch(() => {});
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_permissions_resource_action"
      ON "permissions" ("resource", "action")
    `).catch(() => {});

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_roles_name" ON "roles" ("name")
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_id" uuid,
        "role" varchar(100),
        "permission_id" uuid NOT NULL,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "is_granted" boolean NOT NULL DEFAULT true,
        "granted_by" uuid,
        "reason" text,
        "expires_at" TIMESTAMP,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id")
      )
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_permissions"
      ON "user_permissions" ("user_id", "permission_id")
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "permission_audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" varchar(100) NOT NULL,
        "user_id" uuid,
        "changes" jsonb,
        "ip_address" varchar(100),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_audit_log" PRIMARY KEY ("id")
      )
    `);
  }

  private async ensureFeatureControlsTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS feature_controls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        permission_id UUID NULL,
        permission_code VARCHAR(150) NOT NULL,
        scope VARCHAR(20) NOT NULL DEFAULT 'PLATFORM',
        tenant_id UUID NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by UUID NULL,
        reason TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_controls_platform_code
        ON feature_controls (permission_code)
        WHERE scope = 'PLATFORM' AND tenant_id IS NULL
    `).catch(() => {});
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_controls_tenant_code
        ON feature_controls (permission_code, tenant_id)
        WHERE scope = 'TENANT' AND tenant_id IS NOT NULL
    `).catch(() => {});
  }

  private async seedRoles() {
    const systemRoles = [
      ['SUPER_ADMIN', 'Full system access across all tenants', true],
      ['ADMIN', 'Tenant-level administrative access', true],
      ['TENANT_ADMIN', 'Tenant workspace administrator access', true],
      ['CARGO_OWNER', 'Cargo owner operational access', true],
      ['CARGO_RECEIVER', 'Cargo receiver access', true],
      ['TRUCK_OWNER', 'Truck fleet management access', true],
      ['DRIVER', 'Driver operational access', true],
      ['BROKER', 'Broker intermediary access', true],
      ['LENDER', 'Financial lending access', true],
      ['AGENT', 'Agent coordination access', true],
      ['CUSTOMS_OFFICER', 'Customs inspection access', true],
      ['FLEET_MANAGER', 'Fleet management operational access', true],
      ['FLEET_DISPATCHER', 'Fleet dispatch operational access', true],
      ['FLEET_ACCOUNTANT', 'Fleet financial and accounting access', true],
      ['FLEET_SAFETY_OFFICER', 'Fleet safety and compliance access', true],
      ['PARKING_RESERVATION_MANAGER', 'Parking reservation officer access', true],
    ];

    for (const [name, description, isSystem] of systemRoles) {
      await this.dataSource.query(
        `
        INSERT INTO "roles" ("name", "description", "is_system")
        VALUES ($1, $2, $3)
        ON CONFLICT ("name") DO NOTHING
      `,
        [name, description, isSystem],
      ).catch(async () => {
        const existing = await this.dataSource.query(`SELECT id FROM roles WHERE name = $1`, [name]);
        if (!existing.length) {
          await this.dataSource.query(
            `INSERT INTO roles (name, description, is_system) VALUES ($1, $2, $3)`,
            [name, description, isSystem],
          );
        }
      });
    }

    await this.seedRoleOperationalPermissions();
  }

  private async seedRoleOperationalPermissions() {
    const rolePerms = this.roleDefaults || FALLBACK_ROLE_DEFAULTS;

    const columns = await this.dataSource.query(
      `SELECT column_name, is_nullable FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'role_permissions'
         AND column_name IN ('role', 'role_id')`,
    );
    const hasRoleId = columns.some((c: any) => c.column_name === 'role_id');
    const hasRole = columns.some((c: any) => c.column_name === 'role');

    for (const [roleName, permissions] of Object.entries(rolePerms)) {
      for (const permission of permissions) {
        const [resource, action] = permission.split(':');
        let permRows = await this.dataSource.query(
          `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
          [permission],
        ).catch(() => []);
        if (!permRows.length) {
          permRows = await this.dataSource.query(
            `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
            [resource, action],
          );
        }
        if (!permRows.length) continue;
        const permissionId = permRows[0].id;

        try {
          let roleId: string | null = null;
          if (hasRoleId) {
            const roleRows = await this.dataSource.query(
              `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
              [roleName],
            );
            roleId = roleRows[0]?.id || null;
          }

          // Hybrid production schema: role_id + role (varchar NOT NULL)
          if (hasRoleId && hasRole && roleId) {
            const existing = await this.dataSource.query(
              `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1`,
              [roleId, permissionId],
            );
            if (existing.length) continue;
            await this.dataSource.query(
              `INSERT INTO role_permissions (role_id, role, permission_id) VALUES ($1, $2, $3)`,
              [roleId, roleName, permissionId],
            );
          } else if (hasRoleId && roleId) {
            await this.dataSource.query(
              `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [roleId, permissionId],
            );
          } else if (hasRole) {
            const existing = await this.dataSource.query(
              `SELECT 1 FROM role_permissions WHERE role = $1 AND permission_id = $2 LIMIT 1`,
              [roleName, permissionId],
            );
            if (existing.length) continue;
            await this.dataSource.query(
              `INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)`,
              [roleName, permissionId],
            );
          }
        } catch (err: any) {
          this.logger.warn(`Role link ${roleName}→${permission}: ${err?.message || err}`);
        }
      }
    }
  }
}
