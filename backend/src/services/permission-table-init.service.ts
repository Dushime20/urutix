import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/** Canonical enterprise capability catalog used for Super Admin grant/deny UI */
export const ENTERPRISE_PERMISSION_CATALOG: Array<[string, string, string, string]> = [
  // Cargo
  ['cargo', 'view', 'cargo', 'View cargo loads'],
  ['cargo', 'view_own', 'cargo', 'View own cargo loads'],
  ['cargo', 'create', 'cargo', 'Create new cargo loads'],
  ['cargo', 'edit', 'cargo', 'Edit cargo loads'],
  ['cargo', 'delete', 'cargo', 'Delete cargo loads'],
  ['cargo', 'publish', 'cargo', 'Publish cargo for bidding or matching'],
  ['cargo', 'approve', 'cargo', 'Approve or reject cargo loads'],
  ['cargo', 'assign_receiver', 'cargo', 'Assign receiver to cargo'],
  // Fleet / Truck
  ['fleet', 'view', 'truck', 'View trucks'],
  ['fleet', 'view_own', 'truck', 'View own trucks'],
  ['fleet', 'create', 'truck', 'Register / create trucks'],
  ['fleet', 'edit', 'truck', 'Edit truck details'],
  ['fleet', 'delete', 'truck', 'Delete trucks'],
  ['fleet', 'assign_driver', 'truck', 'Assign driver to truck'],
  // Drivers
  ['drivers', 'view', 'driver', 'View drivers'],
  ['drivers', 'view_own', 'driver', 'View own driver profile'],
  ['drivers', 'create', 'driver', 'Create drivers'],
  ['drivers', 'edit', 'driver', 'Edit drivers'],
  ['drivers', 'delete', 'driver', 'Delete drivers'],
  // Bidding
  ['auctions', 'view', 'bidding', 'View auctions'],
  ['auctions', 'create', 'bidding', 'Create auctions / publish for bid'],
  ['auctions', 'manage', 'bidding', 'Manage auction lifecycle'],
  ['bids', 'view', 'bidding', 'View bids'],
  ['bids', 'view_own', 'bidding', 'View own bids'],
  ['bids', 'create', 'bidding', 'Place bids on cargo'],
  ['bids', 'manage', 'bidding', 'Accept or reject bids'],
  ['bids', 'view_history', 'bidding', 'View bid history'],
  // Smart Matching
  ['matching', 'request', 'matching', 'Use Smart Matching (find / request)'],
  ['matching', 'respond', 'matching', 'Respond to Smart Matching requests'],
  ['matching', 'view_results', 'matching', 'View Smart Matching results'],
  ['matching', 'analytics', 'matching', 'View matching analytics'],
  // Trips
  ['trips', 'view', 'trip', 'View trips'],
  ['trips', 'view_assigned', 'trip', 'View assigned trips'],
  ['trips', 'create', 'trip', 'Create trips'],
  ['trips', 'start', 'trip', 'Start a trip'],
  ['trips', 'complete', 'trip', 'Complete a trip'],
  ['trips', 'pause', 'trip', 'Pause a trip'],
  ['trips', 'resume', 'trip', 'Resume a trip'],
  ['trips', 'cancel', 'trip', 'Cancel a trip'],
  ['trips', 'assign_driver', 'trip', 'Assign driver to trip'],
  ['trips', 'track', 'trip', 'Track trip location'],
  ['trips', 'view_epod', 'trip', 'View ePOD'],
  ['trips', 'confirm_epod', 'trip', 'Confirm ePOD'],
  // Lending
  ['lending', 'view', 'lending', 'View lending dashboard'],
  ['lending', 'view_own', 'lending', 'View own loan requests'],
  ['lending', 'create_request', 'lending', 'Create loan / financing request'],
  ['lending', 'approve', 'lending', 'Approve or reject loan requests'],
  ['lending', 'disburse', 'lending', 'Disburse loans'],
  ['lending', 'repayment', 'lending', 'Manage repayments'],
  ['lending', 'policies', 'lending', 'Manage lending policies'],
  // Brokers
  ['brokers', 'view', 'broker', 'View brokers'],
  ['brokers', 'assign', 'broker', 'Assign broker to cargo'],
  ['brokers', 'create', 'broker', 'Create broker accounts'],
  // Customs / receivers
  ['customs', 'view', 'customs', 'View customs inspections'],
  ['customs', 'create', 'customs', 'Create customs inspections'],
  ['customs', 'update', 'customs', 'Update customs status'],
  ['receivers', 'view', 'inspection', 'View receivers'],
  ['receivers', 'inspect', 'inspection', 'Submit cargo inspection'],
  // Financial
  ['payments', 'view', 'financial', 'View payments'],
  ['payments', 'view_own', 'financial', 'View own payments'],
  ['payments', 'manage', 'financial', 'Manage payments'],
  ['invoices', 'view', 'financial', 'View invoices'],
  ['invoices', 'create', 'financial', 'Create invoices'],
  // Credits
  ['credits', 'view', 'credits', 'View credits'],
  ['credits', 'purchase', 'credits', 'Purchase credits'],
  ['credits', 'consume', 'credits', 'Consume credits'],
  // Analytics
  ['analytics', 'view_own', 'analytics', 'View own analytics'],
  ['analytics', 'view_tenant', 'analytics', 'View tenant analytics'],
  ['analytics', 'view_all', 'analytics', 'View platform analytics'],
  ['analytics', 'financial', 'analytics', 'View financial analytics'],
  ['analytics', 'cost_trends', 'analytics', 'View cost trends'],
  ['reports', 'view', 'analytics', 'View reports'],
  ['reports', 'export', 'analytics', 'Export reports'],
  // Notifications / users
  ['notifications', 'view', 'notifications', 'View notifications'],
  ['users', 'view_own', 'users', 'View own profile'],
  ['users', 'edit_own', 'users', 'Edit own profile'],
  ['users', 'permissions.manage', 'users', 'Manage user permissions'],
];

/**
 * PermissionTableInitService
 *
 * Ensures RBAC tables + full enterprise permission catalog exist at startup.
 */
@Injectable()
export class PermissionTableInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionTableInitService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensureTables();
      await this.ensureFeatureControlsTable();
      const synced = await this.syncPermissionCatalog();
      await this.seedRoles();
      this.logger.log(`Permission tables initialized (${synced} catalog permissions upserted)`);
    } catch (err) {
      this.logger.warn('Permission table init failed (non-critical):', err?.message || err);
    }
  }

  /** Public — Super Admin / detail endpoint can force-refresh the catalog */
  async syncPermissionCatalog(): Promise<number> {
    await this.ensureTables();
    let count = 0;
    for (const [resource, action, category, description] of ENTERPRISE_PERMISSION_CATALOG) {
      try {
        await this.dataSource.query(
          `
          INSERT INTO "permissions" ("resource", "action", "category", "description")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("resource", "action") DO UPDATE
            SET "category" = EXCLUDED."category",
                "description" = EXCLUDED."description"
          `,
          [resource, action, category, description],
        );
        count += 1;
      } catch (err: any) {
        // Fallback when unique constraint name differs (older DBs)
        try {
          const existing = await this.dataSource.query(
            `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
            [resource, action],
          );
          if (existing.length) {
            await this.dataSource.query(
              `UPDATE permissions SET category = $1, description = $2 WHERE id = $3`,
              [category, description, existing[0].id],
            );
          } else {
            await this.dataSource.query(
              `INSERT INTO permissions (resource, action, category, description) VALUES ($1, $2, $3, $4)`,
              [resource, action, category, description],
            );
          }
          count += 1;
        } catch (inner: any) {
          this.logger.warn(`Failed to upsert ${resource}:${action}: ${inner?.message || inner}`);
        }
      }
    }
    await this.seedRoleOperationalPermissions();
    return count;
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

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource" varchar(100) NOT NULL,
        "action" varchar(50) NOT NULL,
        "description" text,
        "category" varchar(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_permissions_resource_action"
      ON "permissions" ("resource", "action")
    `);

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
    const rolePerms: Record<string, string[]> = {
      CARGO_OWNER: [
        'cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit', 'cargo:delete', 'cargo:publish',
        'auctions:view', 'auctions:create', 'bids:view', 'bids:manage',
        'matching:request', 'matching:view_results', 'lending:create_request', 'brokers:assign',
        'trips:view_assigned', 'analytics:view_own', 'analytics:view_tenant',
      ],
      TRUCK_OWNER: [
        'fleet:view', 'fleet:view_own', 'fleet:create', 'fleet:edit', 'fleet:delete', 'fleet:assign_driver',
        'drivers:view', 'drivers:create', 'drivers:edit',
        'auctions:view', 'bids:view_own', 'bids:create', 'bids:view_history',
        'matching:respond', 'trips:view', 'trips:start', 'trips:complete', 'trips:assign_driver',
        'lending:view_own', 'lending:create_request', 'analytics:view_own',
      ],
      DRIVER: [
        'trips:view_assigned', 'trips:start', 'trips:complete', 'trips:pause', 'trips:resume',
        'trips:view_epod', 'analytics:view_own',
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
    };

    const columns = await this.dataSource.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'role_permissions'
         AND column_name IN ('role', 'role_id')`,
    );
    const columnNames = new Set(columns.map((c: any) => c.column_name));

    for (const [roleName, permissions] of Object.entries(rolePerms)) {
      for (const permission of permissions) {
        const [resource, action] = permission.split(':');
        const permRows = await this.dataSource.query(
          `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
          [resource, action],
        );
        if (!permRows.length) continue;
        const permissionId = permRows[0].id;

        if (columnNames.has('role_id')) {
          const roleRows = await this.dataSource.query(
            `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
            [roleName],
          );
          if (!roleRows.length) continue;
          await this.dataSource.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [roleRows[0].id, permissionId],
          ).catch(() => {});
        } else if (columnNames.has('role')) {
          await this.dataSource.query(
            `INSERT INTO role_permissions (role, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [roleName, permissionId],
          ).catch(() => {});
        }
      }
    }
  }
}
