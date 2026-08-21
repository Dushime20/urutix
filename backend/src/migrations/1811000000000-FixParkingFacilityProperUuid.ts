import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class FixParkingFacilityProperUuid1811000000000 implements MigrationInterface {
  name = 'FixParkingFacilityProperUuid1811000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/084_parking_facility_proper_uuid.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(): Promise<void> {
    // Seeded default parking locations are not restored.
  }
}
