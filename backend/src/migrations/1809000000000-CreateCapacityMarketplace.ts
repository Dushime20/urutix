import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class CreateCapacityMarketplace1809000000000 implements MigrationInterface {
  name = 'CreateCapacityMarketplace1809000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/082_create_capacity_marketplace.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "capacity_bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "capacity_offers"`);
  }
}
