import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production fix: relation "shipment_reservations" does not exist.
 *
 * GET /api/availability/trucks queries this table in getBusyTruckIds().
 * Production migrate.js applies backend/migrations/*.sql; this TypeORM migration
 * covers environments that run src/migrations instead.
 *
 * Fully idempotent — safe to re-run.
 */
export class CreateShipmentReservationsIfMissing1815000000000
  implements MigrationInterface
{
  name = 'CreateShipmentReservationsIfMissing1815000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'RELEASED', 'REPLACED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE shipment_reservations_status_enum AS ENUM ('ACTIVE', 'RELEASED', 'REPLACED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shipment_reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "tripId" UUID NOT NULL,
        "cargoId" UUID NOT NULL,
        "truckId" UUID NOT NULL,
        "driverId" UUID,
        "pickupDateTime" TIMESTAMPTZ NOT NULL,
        "deliveryDateTime" TIMESTAMPTZ NOT NULL,
        status reservation_status NOT NULL DEFAULT 'ACTIVE',
        "statusReason" VARCHAR,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shipment_reservations_truck
        ON shipment_reservations("truckId", status, "pickupDateTime", "deliveryDateTime")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shipment_reservations_driver
        ON shipment_reservations("driverId", status, "pickupDateTime", "deliveryDateTime")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shipment_reservations_tenant
        ON shipment_reservations("tenantId", status)
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE UNIQUE INDEX idx_shipment_reservations_active_trip
          ON shipment_reservations("tripId")
          WHERE status <> 'REPLACED';
      EXCEPTION
        WHEN duplicate_table THEN NULL;
        WHEN unique_violation THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_shipment_reservations_active_trip`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_shipment_reservations_tenant`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_shipment_reservations_driver`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_shipment_reservations_truck`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS shipment_reservations`);
  }
}
