import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensures invoices / invoice_items exist on databases that skipped CreateAllTables
 * or were recovered without these tables. Idempotent.
 */
export class EnsureInvoicesTables1786000000001 implements MigrationInterface {
  name = 'EnsureInvoicesTables1786000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoices_status_enum') THEN
          CREATE TYPE "public"."invoices_status_enum" AS ENUM(
            'draft', 'sent', 'paid', 'overdue', 'cancelled'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_items_type_enum') THEN
          CREATE TYPE "public"."invoice_items_type_enum" AS ENUM(
            'freight', 'fuel_surcharge', 'toll', 'detention', 'lumper', 'accessorial'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
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

    await queryRunner.query(`
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "senderId" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "senderName" character varying
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_bf8e0f9dd4558ef209ec111782d'
        ) THEN
          ALTER TABLE "invoices"
            ADD CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
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

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_916db332df1248d4325ff4e5016'
            AND table_name = 'invoices'
        ) THEN
          ALTER TABLE "invoices"
            ADD CONSTRAINT "FK_916db332df1248d4325ff4e5016"
            FOREIGN KEY ("createdBy") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_89c82485e364081f457b210120d'
            AND table_name = 'invoices'
        ) THEN
          ALTER TABLE "invoices"
            ADD CONSTRAINT "FK_89c82485e364081f457b210120d"
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_7fb6895fc8fad9f5200e91abb59'
            AND table_name = 'invoice_items'
        ) THEN
          ALTER TABLE "invoice_items"
            ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"
            FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoices_tenantId" ON "invoices" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoice_items_invoiceId" ON "invoice_items" ("invoiceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_items_invoiceId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_tenantId"`);
    await queryRunner.query(`
      ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "FK_7fb6895fc8fad9f5200e91abb59"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_89c82485e364081f457b210120d"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_916db332df1248d4325ff4e5016"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoice_items_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoices_status_enum"`);
  }
}
