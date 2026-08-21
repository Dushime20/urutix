import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class CreateParkingReservations1802000000000 implements MigrationInterface {
  name = 'CreateParkingReservations1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/072_create_parking_reservations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS parking_reservation_activities`);
    await queryRunner.query(`DROP TABLE IF EXISTS parking_reservations`);
    await queryRunner.query(`DROP TABLE IF EXISTS parking_reservation_sequences`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_parking_facility_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_parking_facility_default`);
    await queryRunner.query(`DROP TABLE IF EXISTS parking_facility_config`);
  }
}
