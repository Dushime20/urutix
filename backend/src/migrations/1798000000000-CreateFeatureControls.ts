import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class CreateFeatureControls1798000000000 implements MigrationInterface {
  name = 'CreateFeatureControls1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(
      __dirname,
      '../../migrations/070_create_feature_controls.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feature_controls`);
  }
}
