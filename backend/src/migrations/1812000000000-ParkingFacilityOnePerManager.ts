import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class ParkingFacilityOnePerManager1812000000000 implements MigrationInterface {
  name = 'ParkingFacilityOnePerManager1812000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/085_parking_facility_one_per_manager.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_parking_facility_tenant`);
  }
}
