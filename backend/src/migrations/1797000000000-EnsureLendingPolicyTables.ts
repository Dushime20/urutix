import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production fix: relation "lending_policy_interest_rates" (and sibling policy tables) does not exist.
 *
 * POST /api/lending/policies/:lenderId/interest-rates inserts into lending_policy_interest_rates.
 * Docker/production runs SQL migrations via migrate.js; the TypeORM-only migration
 * CreateLendingPolicyTables1734567890123 never ran on those databases.
 *
 * Delegates to migrations/068_create_lending_policy_tables_if_missing.sql so both
 * migration runners stay in sync. Fully idempotent.
 */
export class EnsureLendingPolicyTables1797000000000 implements MigrationInterface {
  name = 'EnsureLendingPolicyTables1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(
      __dirname,
      '../../migrations/068_create_lending_policy_tables_if_missing.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(): Promise<void> {
    // Non-destructive: do not drop policy tables in production.
  }
}
