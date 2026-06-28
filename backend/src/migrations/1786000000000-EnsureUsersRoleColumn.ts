import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Ensure users.role column and related enum exist.
 *
 * Production databases that were created before the role column was added
 * to the User entity will hit "column role does not exist" errors.
 * This migration adds the column idempotently so the server can start
 * without manual intervention.
 *
 * Also ensures:
 * - broker_tenant_id column on users (used for broker tenant scoping)
 * - phone column on users
 * - All columns use ADD COLUMN IF NOT EXISTS so re-runs are safe
 */
export class EnsureUsersRoleColumn1786000000000 implements MigrationInterface {
  name = 'EnsureUsersRoleColumn1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Ensure role enum type exists ──────────────────────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'
        ) THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM (
            'SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN',
            'CARGO_OWNER', 'CARGO_RECEIVER',
            'TRUCK_OWNER', 'DRIVER',
            'FLEET_MANAGER', 'FLEET_DISPATCHER', 'FLEET_ACCOUNTANT', 'FLEET_SAFETY_OFFICER',
            'BROKER', 'LENDER', 'AGENT', 'CUSTOMS_OFFICER'
          );
        END IF;
      END
      $$;
    `);

    // ── 2. Add role column if missing ─────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "role" "public"."users_role_enum" NOT NULL DEFAULT 'CARGO_OWNER';
    `);

    // ── 3. Add status enum type if missing ───────────────────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'users_status_enum'
        ) THEN
          CREATE TYPE "public"."users_status_enum" AS ENUM (
            'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED'
          );
        END IF;
      END
      $$;
    `);

    // ── 4. Add status column if missing ──────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION';
    `);

    // ── 5. Add other missing user columns ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "phone"             varchar,
        ADD COLUMN IF NOT EXISTS "broker_tenant_id"  uuid,
        ADD COLUMN IF NOT EXISTS "login_attempts"    integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "locked_until"      TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "last_login_at"     TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "deleted_at"        TIMESTAMP WITH TIME ZONE;
    `);

    // ── 6. Recreate composite unique index for multi-role support ────────────
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_tenant_email_role"
        ON "users" ("tenantId", "email", "role")
        WHERE "deleted_at" IS NULL;
    `);

    // ── 7. Ensure shipment_reservations table exists (scheduling engine) ─────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'shipment_reservations_status_enum'
        ) THEN
          CREATE TYPE "public"."shipment_reservations_status_enum" AS ENUM (
            'ACTIVE', 'RELEASED', 'REPLACED'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipment_reservations" (
        "id"               uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"         uuid        NOT NULL,
        "tripId"           uuid        NOT NULL,
        "cargoId"          uuid        NOT NULL,
        "truckId"          uuid        NOT NULL,
        "driverId"         uuid,
        "pickupDateTime"   TIMESTAMP WITH TIME ZONE NOT NULL,
        "deliveryDateTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status"           "public"."shipment_reservations_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "statusReason"     varchar,
        "createdAt"        TIMESTAMP   NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipment_reservations" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sr_truck_status"
        ON "shipment_reservations" ("truckId", "status", "pickupDateTime", "deliveryDateTime");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sr_driver_status"
        ON "shipment_reservations" ("driverId", "status", "pickupDateTime", "deliveryDateTime");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sr_tenant_status"
        ON "shipment_reservations" ("tenantId", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove shipment_reservations (safe to drop entirely)
    await queryRunner.query(`DROP TABLE IF EXISTS "shipment_reservations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."shipment_reservations_status_enum"`);

    // Remove added columns from users (idempotent)
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "role",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "phone",
        DROP COLUMN IF EXISTS "broker_tenant_id",
        DROP COLUMN IF EXISTS "login_attempts",
        DROP COLUMN IF EXISTS "locked_until",
        DROP COLUMN IF EXISTS "last_login_at",
        DROP COLUMN IF EXISTS "email_verified_at",
        DROP COLUMN IF EXISTS "deleted_at";
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_tenant_email_role"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_status_enum"`);
  }
}
