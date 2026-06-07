import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: make lenders.tenant_id NOT NULL
 *
 * Business rule: a lender always operates within a specific tenant.
 * There should be no system-level / cross-tenant lenders.
 *
 * Before running this migration ensure all existing lenders have a
 * tenant_id set (run the backfill script if needed).
 */
export class LenderTenantIdNotNull1784000000000 implements MigrationInterface {
  name = 'LenderTenantIdNotNull1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Backfill any NULL tenant_ids by assigning the oldest tenant
    //    (this is a safety net — in a clean system all rows should already have a tenant_id)
    await queryRunner.query(`
      UPDATE lenders
      SET tenant_id = (
        SELECT id FROM tenants ORDER BY "createdAt" ASC LIMIT 1
      )
      WHERE tenant_id IS NULL
    `);

    // 2. Drop the old nullable index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_lenders_tenant_id_status"
    `);

    // 3. Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE lenders
      ALTER COLUMN tenant_id SET NOT NULL
    `);

    // 4. Recreate the index (non-partial, column is now always populated)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lenders_tenant_id_status"
      ON lenders (tenant_id, status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_lenders_tenant_id_status"
    `);

    await queryRunner.query(`
      ALTER TABLE lenders
      ALTER COLUMN tenant_id DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lenders_tenant_id_status"
      ON lenders (tenant_id, status)
      WHERE tenant_id IS NOT NULL
    `);
  }
}
