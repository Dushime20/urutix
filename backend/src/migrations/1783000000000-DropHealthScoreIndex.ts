import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropHealthScoreIndex1783000000000 implements MigrationInterface {
  name = 'DropHealthScoreIndex1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop all objects that depend on tenants.health_score so that
    // TypeORM's synchronize can drop the column cleanly.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_tenants_health_score"`,
    );
    // Also drop last_health_check index if present (same removal batch in synchronize)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_tenants_last_health_check"`,
    );
    // Now drop the columns themselves (IF EXISTS = safe no-op if already gone)
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN IF EXISTS "health_score"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN IF EXISTS "last_health_check"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "health_score" integer DEFAULT 100`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "last_health_check" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tenants_health_score" ON "tenants" ("health_score")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tenants_last_health_check" ON "tenants" ("last_health_check")`,
    );
  }
}
