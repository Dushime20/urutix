import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class ParkingOperatorCountry1813000000000 implements MigrationInterface {
  name = 'ParkingOperatorCountry1813000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/086_parking_operator_country.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "operatorSecondaryLabel"`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "operatorPrimaryLabel"`);
    await queryRunner.query(`ALTER TABLE parking_reservations DROP COLUMN IF EXISTS "companyCountry"`);
  }
}
