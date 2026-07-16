import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensures financial_reports exists on databases that skipped CreateAllTables
 * or were recovered without this table. Idempotent.
 */
export class EnsureFinancialReportsTable1786000000000 implements MigrationInterface {
  name = 'EnsureFinancialReportsTable1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_reports_type_enum') THEN
          CREATE TYPE "public"."financial_reports_type_enum" AS ENUM(
            'pl_statement', 'cash_flow', 'revenue', 'expense', 'profitability'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_reports_period_enum') THEN
          CREATE TYPE "public"."financial_reports_period_enum" AS ENUM(
            'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "financial_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."financial_reports_type_enum" NOT NULL,
        "period" "public"."financial_reports_period_enum" NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "data" json NOT NULL,
        "generatedAt" TIMESTAMP NOT NULL,
        "generatedBy" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        CONSTRAINT "PK_4dd23f1aa1f11c233bad2937702" PRIMARY KEY ("id")
      )
    `);

    // FKs — ignore if already present
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_0f70431b951afb6b76d37f631ec'
            AND table_name = 'financial_reports'
        ) THEN
          ALTER TABLE "financial_reports"
            ADD CONSTRAINT "FK_0f70431b951afb6b76d37f631ec"
            FOREIGN KEY ("createdBy") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_597a1287239ba4a3fbbec552cfb'
            AND table_name = 'financial_reports'
        ) THEN
          ALTER TABLE "financial_reports"
            ADD CONSTRAINT "FK_597a1287239ba4a3fbbec552cfb"
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_financial_reports_tenantId"
      ON "financial_reports" ("tenantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_financial_reports_tenantId"`);
    await queryRunner.query(`
      ALTER TABLE "financial_reports" DROP CONSTRAINT IF EXISTS "FK_597a1287239ba4a3fbbec552cfb"
    `);
    await queryRunner.query(`
      ALTER TABLE "financial_reports" DROP CONSTRAINT IF EXISTS "FK_0f70431b951afb6b76d37f631ec"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "financial_reports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."financial_reports_period_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."financial_reports_type_enum"`);
  }
}
