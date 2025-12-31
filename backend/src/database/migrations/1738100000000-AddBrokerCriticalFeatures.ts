import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerCriticalFeatures1738100000000 implements MigrationInterface {
  name = 'AddBrokerCriticalFeatures1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== LOAD CONTRACTS ====================
    
    // Create contract type enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_contracttype_enum') THEN
          CREATE TYPE "public"."load_contracts_contracttype_enum" AS ENUM('LOAD_AGREEMENT', 'TRANSPORT_AGREEMENT', 'BROKER_AGREEMENT');
        END IF;
      END $$;
    `);

    // Create contract status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_contracts_contractstatus_enum') THEN
          CREATE TYPE "public"."load_contracts_contractstatus_enum" AS ENUM('DRAFT', 'PENDING_SIGNATURE', 'PARTIALLY_SIGNED', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
        END IF;
      END $$;
    `);

    // Create load_contracts table
    const contractsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'load_contracts'
      )
    `);

    if (!contractsTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "load_contracts" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "brokerId" uuid NOT NULL,
          "loadId" uuid NOT NULL,
          "tripId" uuid,
          "cargoOwnerId" uuid NOT NULL,
          "transporterId" uuid NOT NULL,
          "contractType" "public"."load_contracts_contracttype_enum" NOT NULL DEFAULT 'LOAD_AGREEMENT',
          "status" "public"."load_contracts_contractstatus_enum" NOT NULL DEFAULT 'DRAFT',
          "agreedRate" numeric(15,2) NOT NULL,
          "currencyCode" character varying(3) NOT NULL DEFAULT 'KES',
          "commissionRate" numeric(5,2) NOT NULL,
          "commissionAmount" numeric(15,2) NOT NULL,
          "paymentTerms" text,
          "paymentDueDate" date,
          "pickupDate" date,
          "deliveryDate" date,
          "deliveryTerms" text,
          "specialInstructions" text,
          "contractContent" text NOT NULL,
          "contractData" jsonb NOT NULL DEFAULT '{}',
          "cargoOwnerSignature" jsonb,
          "transporterSignature" jsonb,
          "brokerSignature" jsonb,
          "fullySignedAt" date,
          "negotiationHistory" jsonb NOT NULL DEFAULT '[]',
          "expiresAt" date,
          "isTemplate" boolean NOT NULL DEFAULT false,
          "templateId" uuid,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_load_contracts" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_load_contracts_load_status" ON "load_contracts" ("loadId", "status");
        CREATE INDEX "IDX_load_contracts_broker_status" ON "load_contracts" ("brokerId", "status");
        CREATE INDEX "IDX_load_contracts_tenant_created" ON "load_contracts" ("tenantId", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_cargo_owner"
        FOREIGN KEY ("cargoOwnerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_transporter"
        FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_trip"
        FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
        
        ALTER TABLE "load_contracts"
        ADD CONSTRAINT "FK_load_contracts_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);
    }

    // ==================== INSURANCE VERIFICATIONS ====================
    
    // Create verification type enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_verifications_verificationtype_enum') THEN
          CREATE TYPE "public"."insurance_verifications_verificationtype_enum" AS ENUM('INSURANCE', 'LICENSE', 'DOT_NUMBER', 'MC_NUMBER', 'CARGO_INSURANCE', 'BOND');
        END IF;
      END $$;
    `);

    // Create verification status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_verifications_verificationstatus_enum') THEN
          CREATE TYPE "public"."insurance_verifications_verificationstatus_enum" AS ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'INVALID', 'REQUIRES_UPDATE');
        END IF;
      END $$;
    `);

    // Create insurance_verifications table
    const verificationsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'insurance_verifications'
      )
    `);

    if (!verificationsTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "insurance_verifications" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "brokerId" uuid NOT NULL,
          "transporterId" uuid NOT NULL,
          "loadId" uuid,
          "verificationType" "public"."insurance_verifications_verificationtype_enum" NOT NULL,
          "status" "public"."insurance_verifications_verificationstatus_enum" NOT NULL DEFAULT 'PENDING',
          "policyNumber" character varying,
          "licenseNumber" character varying,
          "dotNumber" character varying,
          "mcNumber" character varying,
          "insuranceCompany" character varying,
          "coverageAmount" numeric(15,2),
          "effectiveDate" date,
          "expiryDate" date,
          "verifiedAt" date,
          "verifiedBy" uuid,
          "verificationNotes" text,
          "verificationData" jsonb,
          "rejectionReason" text,
          "isAutomated" boolean NOT NULL DEFAULT false,
          "lastCheckedAt" date,
          "nextCheckDate" date,
          "expiryAlertSent" boolean NOT NULL DEFAULT false,
          "expiryAlertSentAt" date,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_insurance_verifications" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_insurance_verifications_transporter_status" ON "insurance_verifications" ("transporterId", "status");
        CREATE INDEX "IDX_insurance_verifications_load_type" ON "insurance_verifications" ("loadId", "verificationType");
        CREATE INDEX "IDX_insurance_verifications_tenant_created" ON "insurance_verifications" ("tenantId", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "insurance_verifications"
        ADD CONSTRAINT "FK_insurance_verifications_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "insurance_verifications"
        ADD CONSTRAINT "FK_insurance_verifications_transporter"
        FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "insurance_verifications"
        ADD CONSTRAINT "FK_insurance_verifications_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE SET NULL;
        
        ALTER TABLE "insurance_verifications"
        ADD CONSTRAINT "FK_insurance_verifications_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);
    }

    // ==================== BROKER DISPUTES ====================
    
    // Create dispute category enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputecategory_enum') THEN
          CREATE TYPE "public"."broker_disputes_disputecategory_enum" AS ENUM('DAMAGE', 'DELAY', 'PAYMENT', 'QUALITY', 'ROUTE', 'COMMUNICATION', 'OTHER');
        END IF;
      END $$;
    `);

    // Create dispute status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputestatus_enum') THEN
          CREATE TYPE "public"."broker_disputes_disputestatus_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'CLOSED', 'ESCALATED');
        END IF;
      END $$;
    `);

    // Create dispute severity enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_disputes_disputeseverity_enum') THEN
          CREATE TYPE "public"."broker_disputes_disputeseverity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
        END IF;
      END $$;
    `);

    // Create broker_disputes table
    const disputesTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'broker_disputes'
      )
    `);

    if (!disputesTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "broker_disputes" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "brokerId" uuid NOT NULL,
          "loadId" uuid NOT NULL,
          "tripId" uuid,
          "raisedById" uuid NOT NULL,
          "disputedWithId" uuid NOT NULL,
          "category" "public"."broker_disputes_disputecategory_enum" NOT NULL,
          "status" "public"."broker_disputes_disputestatus_enum" NOT NULL DEFAULT 'OPEN',
          "severity" "public"."broker_disputes_disputeseverity_enum" NOT NULL DEFAULT 'MEDIUM',
          "description" text NOT NULL,
          "resolution" text,
          "claimedAmount" numeric(15,2),
          "resolvedAmount" numeric(15,2),
          "evidence" jsonb NOT NULL DEFAULT '[]',
          "mediatorId" uuid,
          "mediationHistory" jsonb NOT NULL DEFAULT '[]',
          "communications" jsonb NOT NULL DEFAULT '[]',
          "resolvedAt" date,
          "resolvedBy" uuid,
          "resolutionNotes" text,
          "resolutionTerms" jsonb,
          "escalatedAt" date,
          "closedAt" date,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_broker_disputes" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_broker_disputes_broker_status" ON "broker_disputes" ("brokerId", "status");
        CREATE INDEX "IDX_broker_disputes_load_status" ON "broker_disputes" ("loadId", "status");
        CREATE INDEX "IDX_broker_disputes_trip_status" ON "broker_disputes" ("tripId", "status");
        CREATE INDEX "IDX_broker_disputes_tenant_created" ON "broker_disputes" ("tenantId", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_raised_by"
        FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_disputed_with"
        FOREIGN KEY ("disputedWithId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_mediator"
        FOREIGN KEY ("mediatorId") REFERENCES "users"("id") ON DELETE SET NULL;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_trip"
        FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
        
        ALTER TABLE "broker_disputes"
        ADD CONSTRAINT "FK_broker_disputes_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);
    }

    // ==================== ESCROW ACCOUNTS ====================
    
    // Create escrow status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_accounts_escrowstatus_enum') THEN
          CREATE TYPE "public"."escrow_accounts_escrowstatus_enum" AS ENUM('PENDING', 'FUNDED', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
        END IF;
      END $$;
    `);

    // Create release trigger enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_accounts_releasetrigger_enum') THEN
          CREATE TYPE "public"."escrow_accounts_releasetrigger_enum" AS ENUM('DELIVERY_CONFIRMED', 'MILESTONE_REACHED', 'MANUAL', 'DISPUTE_RESOLVED', 'TIME_BASED');
        END IF;
      END $$;
    `);

    // Create escrow_accounts table
    const escrowTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'escrow_accounts'
      )
    `);

    if (!escrowTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "escrow_accounts" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "brokerId" uuid NOT NULL,
          "loadId" uuid NOT NULL,
          "tripId" uuid,
          "payerId" uuid NOT NULL,
          "payeeId" uuid NOT NULL,
          "status" "public"."escrow_accounts_escrowstatus_enum" NOT NULL DEFAULT 'PENDING',
          "totalAmount" numeric(15,2) NOT NULL,
          "currencyCode" character varying(3) NOT NULL DEFAULT 'KES',
          "fundedAmount" numeric(15,2) NOT NULL DEFAULT 0,
          "releasedAmount" numeric(15,2) NOT NULL DEFAULT 0,
          "commissionAmount" numeric(15,2) NOT NULL DEFAULT 0,
          "paymentMethod" character varying,
          "paymentReference" character varying,
          "transactionId" character varying,
          "fundedAt" date,
          "releaseSchedule" jsonb NOT NULL DEFAULT '[]',
          "autoReleaseConfig" jsonb,
          "releaseHistory" jsonb NOT NULL DEFAULT '[]',
          "disputeId" uuid,
          "isDisputed" boolean NOT NULL DEFAULT false,
          "disputedAt" date,
          "refundedAmount" numeric(15,2) NOT NULL DEFAULT 0,
          "refundHistory" jsonb NOT NULL DEFAULT '[]',
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_escrow_accounts" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_escrow_accounts_load_status" ON "escrow_accounts" ("loadId", "status");
        CREATE INDEX "IDX_escrow_accounts_trip_status" ON "escrow_accounts" ("tripId", "status");
        CREATE INDEX "IDX_escrow_accounts_tenant_created" ON "escrow_accounts" ("tenantId", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_payer"
        FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_payee"
        FOREIGN KEY ("payeeId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
        
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_trip"
        FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
        
        ALTER TABLE "escrow_accounts"
        ADD CONSTRAINT "FK_escrow_accounts_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);
    }

    // ==================== LOAD DOCUMENTS ====================
    
    // Create document type enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_documents_documenttype_enum') THEN
          CREATE TYPE "public"."load_documents_documenttype_enum" AS ENUM('BILL_OF_LADING', 'PROOF_OF_DELIVERY', 'PROOF_OF_PICKUP', 'INVOICE', 'COMMISSION_INVOICE', 'INSURANCE_CERTIFICATE', 'CONTRACT', 'WEIGHT_TICKET', 'DELIVERY_RECEIPT', 'DAMAGE_REPORT', 'OTHER');
        END IF;
      END $$;
    `);

    // Create document status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_documents_documentstatus_enum') THEN
          CREATE TYPE "public"."load_documents_documentstatus_enum" AS ENUM('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'VERIFIED', 'REJECTED', 'EXPIRED');
        END IF;
      END $$;
    `);

    // Create load_documents table
    const documentsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'load_documents'
      )
    `);

    if (!documentsTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "load_documents" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "loadId" uuid NOT NULL,
          "tripId" uuid,
          "brokerId" uuid,
          "uploadedById" uuid NOT NULL,
          "documentType" "public"."load_documents_documenttype_enum" NOT NULL,
          "status" "public"."load_documents_documentstatus_enum" NOT NULL DEFAULT 'DRAFT',
          "fileName" character varying NOT NULL,
          "fileUrl" character varying NOT NULL,
          "fileType" character varying,
          "fileSize" integer,
          "mimeType" character varying,
          "documentContent" text,
          "documentData" jsonb,
          "signatures" jsonb,
          "signedAt" date,
          "verifiedById" uuid,
          "verifiedAt" date,
          "verificationNotes" text,
          "expiresAt" date,
          "description" text,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_load_documents" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_load_documents_load_type" ON "load_documents" ("loadId", "documentType");
        CREATE INDEX "IDX_load_documents_trip_type" ON "load_documents" ("tripId", "documentType");
        CREATE INDEX "IDX_load_documents_tenant_created" ON "load_documents" ("tenantId", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE SET NULL;
        
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_uploaded_by"
        FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_verified_by"
        FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL;
        
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
        
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_trip"
        FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
        
        ALTER TABLE "load_documents"
        ADD CONSTRAINT "FK_load_documents_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "load_documents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "escrow_accounts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_disputes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "insurance_verifications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "load_contracts" CASCADE;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_documents_documentstatus_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_documents_documenttype_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."escrow_accounts_releasetrigger_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."escrow_accounts_escrowstatus_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."broker_disputes_disputeseverity_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."broker_disputes_disputestatus_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."broker_disputes_disputecategory_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."insurance_verifications_verificationstatus_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."insurance_verifications_verificationtype_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_contracts_contractstatus_enum" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_contracts_contracttype_enum" CASCADE;`);
  }
}

