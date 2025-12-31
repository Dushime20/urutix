import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerIntelligenceFeatures1738200000000
  implements MigrationInterface
{
  name = 'AddBrokerIntelligenceFeatures1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "broker_match_recommendation_type_enum" AS ENUM(
          'AI_POWERED',
          'ROUTE_OPTIMIZED',
          'BUNDLING_OPPORTUNITY',
          'BACKHAUL_IDENTIFIED',
          'COST_OPTIMIZED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "broker_match_status_enum" AS ENUM(
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'EXPIRED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "market_rate_type_enum" AS ENUM(
          'REAL_TIME',
          'HISTORICAL',
          'PREDICTED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "credit_status_enum" AS ENUM(
          'APPROVED',
          'PENDING',
          'REJECTED',
          'SUSPENDED',
          'REVIEW_REQUIRED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_term_type_enum" AS ENUM(
          'NET_15',
          'NET_30',
          'NET_45',
          'NET_60',
          'DUE_ON_RECEIPT',
          'CUSTOM'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create broker_match_recommendations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_match_recommendations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "brokerId" character varying NOT NULL,
        "loadId" character varying NOT NULL,
        "transporterId" character varying,
        "truckId" character varying,
        "recommendationType" "broker_match_recommendation_type_enum" NOT NULL,
        "status" "broker_match_status_enum" NOT NULL DEFAULT 'PENDING',
        "matchScore" numeric(5,2) NOT NULL,
        "confidenceLevel" numeric(5,2) NOT NULL,
        "matchingFactors" jsonb NOT NULL,
        "routeOptimization" jsonb,
        "bundlingOpportunity" jsonb,
        "backhaulOpportunity" jsonb,
        "aiInsights" jsonb,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_match_recommendations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_broker_load" 
      ON "broker_match_recommendations" ("brokerId", "loadId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_broker_status" 
      ON "broker_match_recommendations" ("brokerId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_match_recommendations_transporter_status" 
      ON "broker_match_recommendations" ("transporterId", "status")
    `);

    // Create broker_market_intelligence table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_market_intelligence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "brokerId" character varying NOT NULL,
        "rateType" "market_rate_type_enum" NOT NULL,
        "route" jsonb NOT NULL,
        "currentRate" numeric(12,2) NOT NULL,
        "averageRate" numeric(12,2),
        "medianRate" numeric(12,2),
        "minRate" numeric(12,2),
        "maxRate" numeric(12,2),
        "recommendedRate" numeric(12,2),
        "historicalTrends" jsonb,
        "demandForecast" jsonb,
        "rateRecommendations" jsonb,
        "marketFactors" jsonb,
        "pricingInsights" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_market_intelligence" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_broker_route" 
      ON "broker_market_intelligence" ("brokerId", "route")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_broker_created" 
      ON "broker_market_intelligence" ("brokerId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_market_intelligence_route_type" 
      ON "broker_market_intelligence" ("route", "rateType")
    `);

    // Create broker_transporter_credit table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_transporter_credit" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "brokerId" character varying NOT NULL,
        "transporterId" character varying NOT NULL,
        "status" "credit_status_enum" NOT NULL DEFAULT 'PENDING',
        "creditLimit" numeric(12,2) NOT NULL,
        "currentBalance" numeric(12,2) NOT NULL DEFAULT 0,
        "availableCredit" numeric(12,2) NOT NULL DEFAULT 0,
        "paymentTerms" "payment_term_type_enum" NOT NULL,
        "customPaymentDays" integer,
        "creditCheck" jsonb,
        "paymentHistory" jsonb,
        "riskAssessment" jsonb,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_transporter_credit" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_credit_broker_transporter" 
      ON "broker_transporter_credit" ("brokerId", "transporterId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_credit_transporter_status" 
      ON "broker_transporter_credit" ("transporterId", "status")
    `);

    // Create broker_multi_stop_loads table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_multi_stop_loads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "brokerId" character varying NOT NULL,
        "loadId" character varying NOT NULL,
        "stops" jsonb NOT NULL,
        "optimizedRoute" jsonb,
        "routeOptimization" jsonb,
        "stopSequenceOptimization" jsonb,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_multi_stop_loads" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_multi_stop_loads_broker_load" 
      ON "broker_multi_stop_loads" ("brokerId", "loadId")
    `);

    // Create broker_transporter_performance table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_transporter_performance" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "brokerId" character varying NOT NULL,
        "transporterId" character varying NOT NULL,
        "reliabilityScore" numeric(5,2) NOT NULL,
        "onTimeDeliveryRate" numeric(5,2) NOT NULL,
        "damageRate" numeric(5,2) NOT NULL,
        "predictiveMatchSuccess" numeric(5,2) NOT NULL,
        "reliabilityMetrics" jsonb NOT NULL,
        "onTimeTracking" jsonb NOT NULL,
        "damageAnalysis" jsonb NOT NULL,
        "predictiveMetrics" jsonb NOT NULL,
        "historicalTrends" jsonb,
        "comparativeAnalysis" jsonb,
        "calculatedAt" TIMESTAMP NOT NULL,
        "lastLoadDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_transporter_performance" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_performance_broker_transporter" 
      ON "broker_transporter_performance" ("brokerId", "transporterId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broker_transporter_performance_transporter_calculated" 
      ON "broker_transporter_performance" ("transporterId", "calculatedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_transporter_performance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_multi_stop_loads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_transporter_credit"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_market_intelligence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_match_recommendations"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "payment_term_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credit_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "market_rate_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "broker_match_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "broker_match_recommendation_type_enum"`);
  }
}

