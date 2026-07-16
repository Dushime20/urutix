import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Ensures financial_reports exists at startup when migrations were not applied.
 * Safe to run repeatedly (IF NOT EXISTS).
 */
@Injectable()
export class FinancialSchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(FinancialSchemaInitService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensureFinancialReportsTable();
      this.logger.log('Financial reports schema verified');
    } catch (err: any) {
      this.logger.warn(
        `Financial schema init failed (non-critical): ${err?.message || err}`,
      );
    }
  }

  private async ensureFinancialReportsTable() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});

    await this.dataSource.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_reports_type_enum') THEN
          CREATE TYPE "public"."financial_reports_type_enum" AS ENUM(
            'pl_statement', 'cash_flow', 'revenue', 'expense', 'profitability'
          );
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_reports_period_enum') THEN
          CREATE TYPE "public"."financial_reports_period_enum" AS ENUM(
            'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
          );
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
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

    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_financial_reports_tenantId"
      ON "financial_reports" ("tenantId")
    `).catch(() => {});
  }
}
