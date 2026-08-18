import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddParkingFeeSchedules1805000000000 implements MigrationInterface {
  name = 'AddParkingFeeSchedules1805000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/078_parking_fee_schedules.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_reservations_fee_schedule`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "feeScheduleId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_fee_schedules_status_dates`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_fee_schedules_lookup`);
    await queryRunner.query(`DROP TABLE IF EXISTS parking_fee_schedules`);
  }
}
