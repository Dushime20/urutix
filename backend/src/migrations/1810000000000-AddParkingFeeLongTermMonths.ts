import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddParkingFeeLongTermMonths1810000000000 implements MigrationInterface {
  name = 'AddParkingFeeLongTermMonths1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/083_parking_fee_long_term_months.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE parking_fee_schedules DROP COLUMN IF EXISTS "longTermMonths"`);
  }
}
