import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRouteLocationColumns1747093237000 implements MigrationInterface {
  name = 'AddRouteLocationColumns1747093237000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Origin exact coordinates and full address
    await queryRunner.query(`
      ALTER TABLE "routes"
        ADD COLUMN IF NOT EXISTS "origin_lat"     DECIMAL(10,7)  NULL,
        ADD COLUMN IF NOT EXISTS "origin_lng"     DECIMAL(10,7)  NULL,
        ADD COLUMN IF NOT EXISTS "origin_address" VARCHAR(255)   NULL
    `);

    // Destination exact coordinates and full address
    await queryRunner.query(`
      ALTER TABLE "routes"
        ADD COLUMN IF NOT EXISTS "destination_lat"     DECIMAL(10,7)  NULL,
        ADD COLUMN IF NOT EXISTS "destination_lng"     DECIMAL(10,7)  NULL,
        ADD COLUMN IF NOT EXISTS "destination_address" VARCHAR(255)   NULL
    `);

    // Spatial index for fast geo queries on origin
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_routes_origin_coords"
        ON "routes" ("origin_lat", "origin_lng")
        WHERE "origin_lat" IS NOT NULL AND "origin_lng" IS NOT NULL
    `);

    // Spatial index for fast geo queries on destination
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_routes_destination_coords"
        ON "routes" ("destination_lat", "destination_lng")
        WHERE "destination_lat" IS NOT NULL AND "destination_lng" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_routes_destination_coords"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_routes_origin_coords"`);

    await queryRunner.query(`
      ALTER TABLE "routes"
        DROP COLUMN IF EXISTS "destination_address",
        DROP COLUMN IF EXISTS "destination_lng",
        DROP COLUMN IF EXISTS "destination_lat",
        DROP COLUMN IF EXISTS "origin_address",
        DROP COLUMN IF EXISTS "origin_lng",
        DROP COLUMN IF EXISTS "origin_lat"
    `);
  }
}
