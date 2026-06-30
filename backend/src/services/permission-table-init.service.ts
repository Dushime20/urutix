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
      ['auctions', 'manage', 'bidding', 'Manage auction lifecycle'],
      ['bids',     'view',   'bidding', 'View all bids on auctions'],
      ['bids',     'manage', 'bidding', 'Accept, reject or manage bids'],
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
  }
}
