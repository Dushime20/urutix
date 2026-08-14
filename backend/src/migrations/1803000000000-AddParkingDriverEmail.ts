import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddParkingDriverEmail1803000000000 implements MigrationInterface {
  name = 'AddParkingDriverEmail1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/075_add_parking_driver_email.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_reservations_driver_email`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "driverEmail"`);
  }
}
