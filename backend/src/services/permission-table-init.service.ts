import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * PermissionTableInitService
 *
 * Ensures that RBAC-related raw SQL tables (user_permissions, permission_audit_log,
 * permissions seed data) exist at startup. Safe to run multiple times — uses
 * CREATE TABLE IF NOT EXISTS and INSERT … ON CONFLICT DO NOTHING.
 */
@Injectable()
export class PermissionTableInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionTableInitService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensureTables();
      await this.seedPermissions();
      await this.seedRoles();
      this.logger.log('Permission tables initialized successfully');
    } catch (err) {
      // Non-blocking: log the error but don't crash the app
      this.logger.warn('Permission table init failed (non-critical):', err?.message || err);
    }
  }

  private async ensureTables() {
    // Enable uuid extension
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});

    // permissions table
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

    // roles table
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

    // role_permissions table
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" varchar(100) NOT NULL,
        "permission_id" uuid NOT NULL,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "granted_by" varchar(255),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
      )
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_role_permissions"
      ON "role_permissions" ("role", "permission_id")
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_role_permissions_role" ON "role_permissions" ("role")
    `);

    // user_permissions table
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "is_granted" boolean NOT NULL DEFAULT true,
        "granted_by" varchar(255),
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
      CREATE INDEX IF NOT EXISTS "IDX_user_permissions_user_id"
      ON "user_permissions" ("user_id")
    `);

    // permission_audit_log table
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "permission_audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" varchar(255) NOT NULL,
        "user_id" varchar(255),
        "changes" jsonb,
        "ip_address" varchar(100),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_audit_log" PRIMARY KEY ("id")
      )
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_perm_audit_entity"
      ON "permission_audit_log" ("entity_type", "entity_id")
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_perm_audit_created"
      ON "permission_audit_log" ("created_at" DESC)
    `);
  }

  private async seedPermissions() {
    const perms = [
      // User Management
      ['users', 'view',               'user_management',   'View all users in the system'],
      ['users', 'create',             'user_management',   'Create new user accounts'],
      ['users', 'edit',               'user_management',   'Edit user profile and details'],
      ['users', 'delete',             'user_management',   'Delete user accounts'],
      ['users', 'permissions.manage', 'user_management',   'Assign and revoke user permissions'],
      // Cargo Management
      ['cargo', 'view',    'cargo_management', 'View cargo shipments and loads'],
      ['cargo', 'create',  'cargo_management', 'Create new cargo loads'],
      ['cargo', 'edit',    'cargo_management', 'Edit existing cargo loads'],
      ['cargo', 'delete',  'cargo_management', 'Delete cargo loads'],
      ['cargo', 'approve', 'cargo_management', 'Approve or reject cargo loads'],
      ['cargo', 'publish', 'cargo_management', 'Publish cargo loads for bidding/matching'],
      // Fleet Management
      ['fleet', 'view',   'fleet_management', 'View fleet trucks and vehicles'],
      ['fleet', 'create', 'fleet_management', 'Add new trucks to the fleet'],
      ['fleet', 'edit',   'fleet_management', 'Edit fleet vehicle details'],
      ['fleet', 'delete', 'fleet_management', 'Remove vehicles from fleet'],
      // Driver Management
      ['drivers', 'view',   'driver_management', 'View driver profiles'],
      ['drivers', 'create', 'driver_management', 'Onboard new drivers'],
      ['drivers', 'edit',   'driver_management', 'Edit driver details'],
      ['drivers', 'delete', 'driver_management', 'Remove driver accounts'],
      // Broker Management
      ['brokers', 'view',   'broker_management', 'View broker profiles'],
      ['brokers', 'create', 'broker_management', 'Create broker accounts'],
      ['brokers', 'edit',   'broker_management', 'Edit broker details'],
      ['brokers', 'delete', 'broker_management', 'Remove broker accounts'],
      ['brokers', 'assign', 'broker_management', 'Assign broker to a load'],
      // Auctions & Bidding
      ['auctions', 'view',   'bidding', 'View active and past auctions'],
      ['auctions', 'create', 'bidding', 'Create new auction events'],
      ['auctions', 'manage', 'bidding', 'Manage auction lifecycle'],
      ['bids',     'view',   'bidding', 'View all bids on auctions'],
      ['bids',     'view_own', 'bidding', 'View own bids'],
      ['bids',     'create', 'bidding', 'Place a bid on an auction'],
      ['bids',     'manage', 'bidding', 'Accept, reject or manage bids'],
      ['bids',     'view_history', 'bidding', 'View full bid history'],
      // Smart Matching
      ['matching', 'request', 'matching', 'Request AI smart matching'],
      ['matching', 'respond', 'matching', 'Respond to a match request'],
      ['matching', 'view_results', 'matching', 'View match results'],
      ['matching', 'analytics', 'matching', 'View cargo alignment analytics'],
      // Trips / Brokers / Lending (capability management)
      ['trips', 'start', 'trip_management', 'Start a trip'],
      ['trips', 'complete', 'trip_management', 'Mark a trip as completed'],
      ['trips', 'assign_driver', 'trip_management', 'Assign a driver to a trip'],
      ['lending', 'create_request', 'lending', 'Create a new loan request'],
      ['lending', 'approve', 'lending', 'Approve or reject loan requests'],
      // Customs & receivers
      ['customs', 'view', 'customs', 'View customs dashboard and inspections'],
      ['customs', 'create', 'customs', 'Create customs inspections'],
      ['customs', 'update', 'customs', 'Update customs inspection status'],
      ['customs', 'flag', 'customs', 'Flag a shipment for customs inspection'],
      ['receivers', 'inspect', 'receiver_management', 'Submit cargo inspection on delivery'],
      ['receivers', 'view', 'receiver_management', 'View receiver profiles'],
      // Orders & Deliveries
      ['orders',     'view',   'orders_deliveries', 'View transport orders'],
      ['orders',     'create', 'orders_deliveries', 'Create new transport orders'],
      ['orders',     'edit',   'orders_deliveries', 'Edit transport orders'],
      ['deliveries', 'manage', 'orders_deliveries', 'Manage delivery status and tracking'],
      // Financial
      ['invoices', 'view',   'financial', 'View invoices and billing records'],
      ['invoices', 'create', 'financial', 'Generate new invoices'],
      ['payments', 'view',   'financial', 'View payment transactions'],
      ['payments', 'manage', 'financial', 'Process and manage payments'],
      // Analytics & Reports
      ['reports', 'view',   'analytics', 'Access analytics dashboards and reports'],
      ['reports', 'export', 'analytics', 'Export data and generate report files'],
      ['analytics', 'view_own', 'analytics', 'View own analytics dashboard'],
      ['analytics', 'view_tenant', 'analytics', 'View tenant-wide analytics'],
      ['analytics', 'view_all', 'analytics', 'View platform-wide analytics'],
      ['analytics', 'financial', 'analytics', 'View financial analytics'],
      ['analytics', 'cost_trends', 'analytics', 'View cost trend analytics'],
      // System Admin
      ['settings',  'view',   'system_admin', 'View system configuration settings'],
      ['settings',  'edit',   'system_admin', 'Modify system configuration'],
      ['auditlogs', 'view',   'system_admin', 'View audit trail and activity logs'],
      ['system',    'manage', 'system_admin', 'Full system administration access'],
    ];

    for (const [resource, action, category, description] of perms) {
      await this.dataSource.query(`
        INSERT INTO "permissions" ("resource", "action", "category", "description")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("resource", "action") DO UPDATE
          SET "category" = EXCLUDED."category",
              "description" = EXCLUDED."description"
      `, [resource, action, category, description]);
    }
  }

  private async seedRoles() {
    const systemRoles = [
      ['SUPER_ADMIN',          'Full system access across all tenants',       true],
      ['ADMIN',                'Tenant-level administrative access',           true],
      ['TENANT_ADMIN',         'Tenant workspace administrator access',        true],
      ['CARGO_OWNER',          'Cargo owner operational access',               true],
      ['CARGO_RECEIVER',       'Cargo receiver access',                        true],
      ['TRUCK_OWNER',          'Truck fleet management access',                true],
      ['DRIVER',               'Driver operational access',                    true],
      ['BROKER',               'Broker intermediary access',                   true],
      ['LENDER',               'Financial lending access',                     true],
      ['AGENT',                'Agent coordination access',                    true],
      ['CUSTOMS_OFFICER',      'Customs inspection access',                    true],
      ['FLEET_MANAGER',        'Fleet management operational access',          true],
      ['FLEET_DISPATCHER',     'Fleet dispatch operational access',            true],
      ['FLEET_ACCOUNTANT',     'Fleet financial and accounting access',        true],
      ['FLEET_SAFETY_OFFICER', 'Fleet safety and compliance access',           true],
    ];

    for (const [name, description, isSystem] of systemRoles) {
      await this.dataSource.query(`
        INSERT INTO "roles" ("name", "description", "is_system")
        VALUES ($1, $2, $3)
        ON CONFLICT ("name") DO NOTHING
      `, [name, description, isSystem]);
    }

    await this.ensureFeatureControlsTable();
    await this.seedRoleOperationalPermissions();
  }

  /** Idempotent feature_controls table for platform kill-switches */
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
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_controls_tenant_code
        ON feature_controls (permission_code, tenant_id)
        WHERE scope = 'TENANT' AND tenant_id IS NOT NULL
    `);
  }

  /**
   * Ensure operational roles have baseline capabilities (idempotent).
   * Revoking a role_permission is preserved across restarts (ON CONFLICT DO NOTHING).
   * Supports both role_permissions schemas (role varchar vs role_id UUID).
   */
  private async seedRoleOperationalPermissions() {
    const rolePerms: Record<string, string[]> = {
      CARGO_OWNER: [
        'analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends',
        'cargo:create', 'cargo:view', 'cargo:edit', 'cargo:delete', 'cargo:publish',
        'auctions:view', 'auctions:create', 'bids:view', 'bids:manage',
        'matching:request', 'matching:view_results', 'lending:create_request', 'brokers:assign',
      ],
      TRUCK_OWNER: [
        'analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends',
        'auctions:view', 'bids:view_own', 'bids:create', 'bids:view_history', 'matching:respond',
        'fleet:view', 'fleet:create', 'trips:start', 'trips:complete', 'trips:assign_driver',
      ],
      TENANT_ADMIN: [
        'analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends',
        'brokers:assign', 'bids:manage', 'auctions:manage', 'matching:view_results',
        'cargo:view', 'trips:assign_driver',
      ],
      FLEET_MANAGER: [
        'analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends',
        'trips:start', 'trips:complete', 'trips:assign_driver',
      ],
      FLEET_DISPATCHER: ['trips:start', 'trips:complete', 'trips:assign_driver', 'analytics:view_own', 'analytics:view_tenant'],
      FLEET_ACCOUNTANT: ['analytics:view_own', 'analytics:view_tenant', 'analytics:financial', 'analytics:cost_trends'],
      BROKER: [
        'analytics:view_own', 'analytics:view_tenant',
        'auctions:view', 'bids:view', 'bids:manage', 'matching:request', 'matching:view_results',
      ],
      DRIVER: ['analytics:view_own', 'trips:start', 'trips:complete'],
      LENDER: ['lending:approve', 'lending:create_request'],
      CARGO_RECEIVER: ['receivers:inspect', 'receivers:view', 'cargo:view'],
      CUSTOMS_OFFICER: ['customs:view', 'customs:create', 'customs:update', 'customs:flag'],
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
          );
        } else if (columnNames.has('role')) {
          await this.dataSource.query(
            `INSERT INTO role_permissions (role, permission_id)
             VALUES ($1, $2)
             ON CONFLICT ("role", "permission_id") DO NOTHING`,
            [roleName, permissionId],
          );
        }
      }
    }
  }
}
