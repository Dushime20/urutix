import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Ensures critical financial tables exist at startup when SQL migrations
 * were not applied (or skipped CreateAllTables). Safe to run repeatedly.
 */
@Injectable()
export class FinancialSchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(FinancialSchemaInitService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensureFinancialReportsTable();
      await this.ensureInvoicesTables();
      this.logger.log('Financial schema verified (reports + invoices)');
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

    await this.dataSource
      .query(`
      CREATE INDEX IF NOT EXISTS "IDX_financial_reports_tenantId"
      ON "financial_reports" ("tenantId")
    `)
      .catch(() => {});
  }

  private async ensureInvoicesTables() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).catch(() => {});

    await this.dataSource.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoices_status_enum') THEN
          CREATE TYPE "public"."invoices_status_enum" AS ENUM(
            'draft', 'sent', 'paid', 'overdue', 'cancelled'
          );
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_items_type_enum') THEN
          CREATE TYPE "public"."invoice_items_type_enum" AS ENUM(
            'freight', 'fuel_surcharge', 'toll', 'detention', 'lumper', 'accessorial'
          );
        END IF;
      END $$;
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceNumber" character varying NOT NULL,
        "customerId" character varying NOT NULL,
        "customerName" character varying NOT NULL,
        "senderId" character varying,
        "senderName" character varying,
        "tripId" character varying,
        "truckId" character varying,
        "driverId" character varying,
        "issueDate" TIMESTAMP NOT NULL,
        "dueDate" TIMESTAMP NOT NULL,
        "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft',
        "subtotal" numeric(10,2) NOT NULL,
        "taxAmount" numeric(10,2) NOT NULL,
        "totalAmount" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'USD',
        "notes" text,
        "paymentTerms" character varying NOT NULL DEFAULT 'Net 30',
        "paymentMethod" character varying,
        "paidDate" TIMESTAMP,
        "lateFees" numeric(10,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id")
      )
    `);

    await this.dataSource
      .query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "senderId" character varying`)
      .catch(() => {});
    await this.dataSource
      .query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "senderName" character varying`)
      .catch(() => {});

    await this.dataSource
      .query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_bf8e0f9dd4558ef209ec111782d'
        ) THEN
          ALTER TABLE "invoices"
            ADD CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber");
        END IF;
      END $$;
    `)
      .catch(() => {});

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "description" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "totalPrice" numeric(10,2) NOT NULL,
        "type" "public"."invoice_items_type_enum" NOT NULL,
        "tripId" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "invoiceId" uuid,
        CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id")
      )
    `);

    await this.dataSource
      .query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoices_tenantId" ON "invoices" ("tenantId")
    `)
      .catch(() => {});
    await this.dataSource
      .query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_items_invoiceId" ON "invoice_items" ("invoiceId")
    `)
      .catch(() => {});
  }
}
