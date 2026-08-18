import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddParkingFacilityLocations1807000000000 implements MigrationInterface {
  name = 'AddParkingFacilityLocations1807000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/080_parking_facility_locations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_reservations_facility`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP CONSTRAINT IF EXISTS fk_parking_reservations_facility`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "parkingFacilityId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_facility_search`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_facility_tenant
      ON parking_facility_config ("tenantId")
      WHERE "tenantId" IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE parking_facility_config DROP COLUMN IF EXISTS "parkingManagerId"`);
    await queryRunner.query(`ALTER TABLE parking_facility_config DROP COLUMN IF EXISTS "isActive"`);
    await queryRunner.query(`ALTER TABLE parking_facility_config DROP COLUMN IF EXISTS region`);
    await queryRunner.query(`ALTER TABLE parking_facility_config DROP COLUMN IF EXISTS country`);
    await queryRunner.query(`ALTER TABLE parking_facility_config DROP COLUMN IF EXISTS city`);
  }
}
