import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class CreateDistributionCampaigns1808000000000 implements MigrationInterface {
  name = 'CreateDistributionCampaigns1808000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/081_create_distribution_campaigns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_campaigns"`);
  }
}
