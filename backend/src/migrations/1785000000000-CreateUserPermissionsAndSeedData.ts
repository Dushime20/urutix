import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create user_permissions, permission_audit_log tables
 * and seed all system permissions for RBAC.
 */
export class CreateUserPermissionsAndSeedData1785000000000 implements MigrationInterface {
  name = 'CreateUserPermissionsAndSeedData1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Ensure permissions table has all required columns ─────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource" varchar(100) NOT NULL,
        "action" varchar(50) NOT NULL,
        "description" text,
        "category" varchar(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_resource_action" UNIQUE ("resource", "action")
      )
    `);

    // ── 2. Ensure roles table exists ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    // ── 3. Ensure role_permissions table exists ───────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" varchar(100) NOT NULL,
        "permission_id" uuid NOT NULL,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "granted_by" varchar(255),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permissions" UNIQUE ("role", "permission_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_role_permissions_role" ON "role_permissions" ("role")
    `);

    // ── 4. Create user_permissions table ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "is_granted" boolean NOT NULL DEFAULT true,
        "granted_by" varchar(255),
        "reason" text,
        "expires_at" TIMESTAMP,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_permissions" UNIQUE ("user_id", "permission_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_permissions_user_id" ON "user_permissions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_permissions_permission_id" ON "user_permissions" ("permission_id")
    `);

    // ── 5. Create permission_audit_log table ──────────────────────────────────
    await queryRunner.query(`
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
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_perm_audit_entity" ON "permission_audit_log" ("entity_type", "entity_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_perm_audit_created_at" ON "permission_audit_log" ("created_at")
    `);

    // ── 6. Seed all system permissions ────────────────────────────────────────
    const permissions = [
      // User Management
      ['users', 'view',               'user_management',     'View all users in the system'],
      ['users', 'create',             'user_management',     'Create new user accounts'],
      ['users', 'edit',               'user_management',     'Edit user profile and details'],
      ['users', 'delete',             'user_management',     'Delete user accounts'],
      ['users', 'permissions.manage', 'user_management',     'Assign and revoke user permissions'],

      // Cargo Management
      ['cargo', 'view',    'cargo_management', 'View cargo shipments and loads'],
      ['cargo', 'create',  'cargo_management', 'Create new cargo loads'],
      ['cargo', 'edit',    'cargo_management', 'Edit existing cargo loads'],
      ['cargo', 'delete',  'cargo_management', 'Delete cargo loads'],
      ['cargo', 'approve', 'cargo_management', 'Approve or reject cargo loads'],

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

      // Auctions & Bidding
      ['auctions', 'view',   'bidding', 'View active and past auctions'],
      ['auctions', 'create', 'bidding', 'Create new auction events'],
      ['auctions', 'manage', 'bidding', 'Manage auction lifecycle (open/close/cancel)'],
      ['bids',     'view',   'bidding', 'View all bids on auctions'],
      ['bids',     'manage', 'bidding', 'Accept, reject or manage bids'],

      // Orders & Deliveries
      ['orders',     'view',   'orders_deliveries', 'View transport orders'],
      ['orders',     'create', 'orders_deliveries', 'Create new transport orders'],
      ['orders',     'edit',   'orders_deliveries', 'Edit transport orders'],
      ['deliveries', 'manage', 'orders_deliveries', 'Manage delivery status and tracking'],

      // Financial Management
      ['invoices', 'view',   'financial', 'View invoices and billing records'],
      ['invoices', 'create', 'financial', 'Generate new invoices'],
      ['payments', 'view',   'financial', 'View payment transactions'],
      ['payments', 'manage', 'financial', 'Process and manage payments'],

      // Analytics & Reports
      ['reports', 'view',   'analytics', 'Access analytics dashboards and reports'],
      ['reports', 'export', 'analytics', 'Export data and generate report files'],

      // System Administration
      ['settings',  'view',   'system_admin', 'View system configuration settings'],
      ['settings',  'edit',   'system_admin', 'Modify system configuration'],
      ['auditlogs', 'view',   'system_admin', 'View audit trail and activity logs'],
      ['system',    'manage', 'system_admin', 'Full system administration access'],
    ];

    for (const [resource, action, category, description] of permissions) {
      await queryRunner.query(`
        INSERT INTO "permissions" ("resource", "action", "category", "description")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("resource", "action") DO UPDATE
          SET "category" = EXCLUDED."category",
              "description" = EXCLUDED."description"
      `, [resource, action, category, description]);
    }

    // ── 7. Seed system roles ───────────────────────────────────────────────────
    const systemRoles = [
      ['SUPER_ADMIN', 'Full system access across all tenants', true],
      ['ADMIN',       'Tenant-level administrative access', true],
      ['CARGO_OWNER', 'Cargo owner operational access', true],
      ['TRUCK_OWNER', 'Truck fleet management access', true],
      ['DRIVER',      'Driver operational access', true],
      ['BROKER',      'Broker intermediary access', true],
      ['LENDER',      'Financial lending access', true],
      ['CUSTOMS_OFFICER', 'Customs inspection access', true],
    ];

    for (const [name, description, isSystem] of systemRoles) {
      await queryRunner.query(`
        INSERT INTO "roles" ("name", "description", "is_system")
        VALUES ($1, $2, $3)
        ON CONFLICT ("name") DO NOTHING
      `, [name, description, isSystem]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);
  }
}
