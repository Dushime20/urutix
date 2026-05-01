import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEpodAndTripCompletedAt1780000000001 implements MigrationInterface {
  name = 'AddEpodAndTripCompletedAt1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add completedAt column to trips (if not exists)
    await queryRunner.query(`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP
    `);

    // 2. Create epod_status enum (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE epod_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // 3. Create epods table (if not exists)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS epods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" UUID NOT NULL,
        "tripId" UUID NOT NULL UNIQUE,
        "driverId" UUID NOT NULL,
        "cargoOwnerId" UUID NOT NULL,
        "recipientName" VARCHAR(200) NOT NULL,
        "recipientPhone" VARCHAR(50),
        "signatureFileUrl" VARCHAR(500),
        "photoUrls" JSONB NOT NULL DEFAULT '[]',
        "deliveryNotes" TEXT,
        "odometerReading" VARCHAR(100),
        "deliveryAddress" TEXT,
        "deliveryCoordinates" JSONB,
        status epod_status_enum NOT NULL DEFAULT 'PENDING',
        "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "confirmedAt" TIMESTAMP WITH TIME ZONE,
        "invoiceId" UUID,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // 4. Create indexes on epods
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_epods_tenant_status ON epods ("tenantId", status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_epods_cargo_owner ON epods ("cargoOwnerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS epods`);
    await queryRunner.query(`DROP TYPE IF EXISTS epod_status_enum`);
    await queryRunner.query(`ALTER TABLE trips DROP COLUMN IF EXISTS "completedAt"`);
  }
}
