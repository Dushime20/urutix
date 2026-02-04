import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAllTables1762849950556 implements MigrationInterface {
  name = 'CreateAllTables1762849950556';

  // Helper function to create type only if it doesn't exist
  private async createTypeIfNotExists(
    queryRunner: QueryRunner,
    typeName: string,
    enumValues: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
          CREATE TYPE "public"."${typeName}" AS ENUM(${enumValues});
        END IF;
      END $$;
    `);
  }

  // Helper function to create index only if column exists
  private async createIndexIfColumnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    indexName: string,
    indexDefinition: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND column_name = '${columnName}'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = '${indexName}'
          ) THEN
            ${indexDefinition};
          END IF;
        END IF;
      END $$;
    `);
  }

  // Helper function to add constraint only if it doesn't exist
  private async addConstraintIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
    constraintDefinition: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
        ) THEN
          ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" ${constraintDefinition};
        END IF;
      END $$;
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_rate_limits_tenant_endpoint_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_rate_limits_tenant_createdAt"`,
    );

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Try to create PostGIS extension, but continue if it's not available
    // Use a DO block to handle errors without aborting the transaction
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS "postgis";
        RAISE NOTICE 'PostGIS extension created successfully';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available: %', SQLERRM;
      END $$;
    `);

    // Create type only if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kycstatus_enum') THEN
          CREATE TYPE "public"."user_profiles_kycstatus_enum" AS ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tenantId" uuid NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "companyName" character varying, "taxId" character varying, "businessLicense" character varying, "address" character varying, "cityId" integer, "postalCode" character varying, "countryCode" character varying, "avatarUrl" character varying, "deleted_at" TIMESTAMP, "bio" character varying, "websiteUrl" character varying, "insuranceInfo" jsonb NOT NULL DEFAULT '{}', "bankAccountInfo" jsonb NOT NULL DEFAULT '{}', "preferences" jsonb NOT NULL DEFAULT '{}', "kycStatus" "public"."user_profiles_kycstatus_enum" NOT NULL DEFAULT 'PENDING', "kycDocuments" text NOT NULL DEFAULT '[]', "kycVerifiedAt" TIMESTAMP, "rating" numeric(3,2) NOT NULL DEFAULT '0', "totalTrips" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_207051f533bf9ed05dc96c1f3e" ON "user_profiles" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_8481388d6325e752cd4d7e26c6" ON "user_profiles" ("userId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tenants_type_enum',
      `'ENTERPRISE', 'SMALL_BUSINESS', 'INDIVIDUAL', 'PARTNER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tenants_status_enum',
      `'ACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION', 'DEACTIVATED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "subdomain" character varying, "domain" character varying, "type" "public"."tenants_type_enum" NOT NULL DEFAULT 'SMALL_BUSINESS', "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'PENDING_ACTIVATION', "description" character varying, "logoUrl" character varying, "websiteUrl" character varying, "contactEmail" character varying, "contactPhone" character varying, "address" character varying, "city" character varying, "state" character varying, "country" character varying, "postalCode" character varying, "taxId" character varying, "businessLicense" character varying, "settings" jsonb NOT NULL DEFAULT '{}', "features" jsonb NOT NULL DEFAULT '{}', "billingInfo" jsonb NOT NULL DEFAULT '{}', "maxUsers" integer, "maxTrucks" integer, "maxDrivers" integer, "maxLoadsPerMonth" integer, "subscriptionPlan" character varying, "subscriptionExpiresAt" TIMESTAMP, "trialEndsAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT false, "activatedAt" TIMESTAMP, "suspendedAt" TIMESTAMP, "suspendedReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c59559e7872bc9726adef4669f" ON "tenants" ("status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_d488a84526d22ad2b799829b7d" ON "tenants" ("subdomain") WHERE deleted_at IS NULL`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_loadtype_enum',
      `'FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_equipmenttype_enum',
      `'DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'CONTAINER', 'OTHER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_cargotype_enum',
      `'GENERAL', 'FRAGILE', 'HAZARDOUS', 'REFRIGERATED', 'LIQUID', 'OVERSIZED', 'VALUABLE'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_visibility_enum',
      `'public', 'private'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_status_enum',
      `'DRAFT', 'CREATED', 'PUBLISHED', 'PENDING_CONFIRMATION', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'CANCELLED', 'COMPLETED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_paymentterms_enum',
      `'Prepaid', 'OnDelivery', 'Net15', 'Net30', 'Net45', 'Net60'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_urgencylevel_enum',
      `'LOW', 'NORMAL', 'HIGH', 'CRITICAL'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loads_packagingtype_enum',
      `'Palletized', 'Loose', 'Containerized', 'Crate', 'Drum', 'Other'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "loads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "cargoOwnerId" uuid NOT NULL, "reference" character varying, "title" character varying NOT NULL, "description" text, "weight" numeric(10,2) NOT NULL, "volume" numeric(10,2), "loadType" "public"."loads_loadtype_enum" NOT NULL DEFAULT 'FTL', "equipmentType" "public"."loads_equipmenttype_enum" NOT NULL DEFAULT 'DRY_VAN', "cargoType" "public"."loads_cargotype_enum" NOT NULL DEFAULT 'GENERAL', "visibility" "public"."loads_visibility_enum" NOT NULL DEFAULT 'public', "unitsRequired" integer NOT NULL DEFAULT '1', "locations" jsonb NOT NULL DEFAULT '[]', "origin" jsonb, "destination" jsonb, "pickupWindow" jsonb, "deliveryWindow" jsonb, "pickupDate" TIMESTAMP WITH TIME ZONE, "deliveryDate" TIMESTAMP WITH TIME ZONE, "status" "public"."loads_status_enum" NOT NULL DEFAULT 'DRAFT', "loadValue" numeric(15,2) NOT NULL, "offeredPrice" numeric(15,2), "currencyCode" character varying(3) NOT NULL DEFAULT 'USD', "pricing" jsonb, "paymentTerms" "public"."loads_paymentterms_enum" NOT NULL DEFAULT 'Net30', "invitedCarriers" text, "isFragile" boolean NOT NULL DEFAULT false, "isHazardous" boolean NOT NULL DEFAULT false, "requiresRefrigeration" boolean NOT NULL DEFAULT false, "contactInfo" jsonb NOT NULL DEFAULT '{}', "autoMatchEnabled" boolean NOT NULL DEFAULT true, "matchingCriteria" jsonb NOT NULL DEFAULT '{}', "publishedAt" TIMESTAMP, "assignedTruckId" uuid, "assignedCarrierId" uuid, "rating" numeric(3,2) NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "length" numeric(8,2), "width" numeric(8,2), "height" numeric(8,2), "stackableHeight" numeric(8,2), "isStackable" boolean NOT NULL DEFAULT false, "temperatureMin" numeric(5,2), "temperatureMax" numeric(5,2), "requiresHumidityControl" boolean NOT NULL DEFAULT false, "requiresForklift" boolean NOT NULL DEFAULT false, "requiresCrane" boolean NOT NULL DEFAULT false, "requiresLoadingDock" boolean NOT NULL DEFAULT false, "loadingTimeEstimate" numeric(5,2), "unloadingTimeEstimate" numeric(5,2), "hazmatClass" character varying(50), "hazmatNumber" character varying(20), "urgencyLevel" "public"."loads_urgencylevel_enum" NOT NULL DEFAULT 'NORMAL', "isTimeCritical" boolean NOT NULL DEFAULT false, "maxTransitTime" numeric(5,2), "packagingType" "public"."loads_packagingtype_enum" NOT NULL DEFAULT 'Palletized', "numberOfPieces" integer NOT NULL DEFAULT '0', "numberOfPallets" integer NOT NULL DEFAULT '0', "requiresGpsMonitoring" boolean NOT NULL DEFAULT false, "requiresTemperatureMonitoring" boolean NOT NULL DEFAULT false, "insuranceValue" numeric(15,2), "requiresLowClearanceRoute" boolean NOT NULL DEFAULT false, "maxClearanceHeight" numeric(5,2), "requiresEscortVehicle" boolean NOT NULL DEFAULT false, "specialHandlingInstructions" text, "loadingInstructions" text, "unloadingInstructions" text, "emergencyContactInfo" text, "truckRequirements" jsonb NOT NULL DEFAULT '{}', "carrierPreferences" jsonb NOT NULL DEFAULT '{}', "costPreferences" jsonb NOT NULL DEFAULT '{}', "requiresPreShipmentInspection" boolean NOT NULL DEFAULT false, "requiresDeliveryInspection" boolean NOT NULL DEFAULT false, "requiresPhotographicDocumentation" boolean NOT NULL DEFAULT false, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_c90caf6ef671c1a292bc4b4bc1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6c205ed8f1c0bde5f883078a8f" ON "loads" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4bf0030a3bc50c87ee9d62150a" ON "loads" ("cargoOwnerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bb60606ade409eb486e4b5ec67" ON "loads" ("status") `,
    );
    await this.createIndexIfColumnExists(
      queryRunner,
      'loads',
      'equipmentType',
      'IDX_2147d38f116dcc1d8b49dbfb81',
      `CREATE INDEX "IDX_2147d38f116dcc1d8b49dbfb81" ON "loads" ("equipmentType")`,
    );
    await this.createIndexIfColumnExists(
      queryRunner,
      'loads',
      'loadType',
      'IDX_a53c7fe240b4a67cce9053625e',
      `CREATE INDEX "IDX_a53c7fe240b4a67cce9053625e" ON "loads" ("loadType")`,
    );
    await this.createIndexIfColumnExists(
      queryRunner,
      'loads',
      'visibility',
      'IDX_18c0c8ba52eb33c51ecc2a3eaf',
      `CREATE INDEX "IDX_18c0c8ba52eb33c51ecc2a3eaf" ON "loads" ("visibility")`,
    );
    await this.createIndexIfColumnExists(
      queryRunner,
      'loads',
      'reference',
      'IDX_5636b0881461b62c4784c63c2d',
      `CREATE INDEX "IDX_5636b0881461b62c4784c63c2d" ON "loads" ("reference")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4bf0030a3bc50c87ee9d62150a" ON "loads" ("cargoOwnerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_61c9fa9c7fa4eddb9dbad3d09d" ON "loads" ("tenantId", "status") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'bids_status_enum',
      `'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "bids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "truckOwnerId" uuid NOT NULL, "bidAmount" numeric(15,2) NOT NULL, "bidCurrency" character varying(3) NOT NULL DEFAULT 'USD', "proposedPickupDate" TIMESTAMP WITH TIME ZONE, "proposedDeliveryDate" TIMESTAMP WITH TIME ZONE, "status" "public"."bids_status_enum" NOT NULL DEFAULT 'PENDING', "bidNotes" text, "bidDetails" jsonb NOT NULL DEFAULT '{}', "successProbability" numeric(5,2), "riskAssessment" jsonb NOT NULL DEFAULT '{}', "marketContext" jsonb NOT NULL DEFAULT '{}', "isAutoBid" boolean NOT NULL DEFAULT false, "isCounterOffer" boolean NOT NULL DEFAULT false, "parentBidId" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d03cf356cf1520672d4488244b" ON "bids" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0d1ebe448cb691f63a2015d458" ON "bids" ("truckOwnerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_203fecbe7e6e79182d64c11971" ON "bids" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cdded8d682a5e3b1dc092788b5" ON "bids" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_203fecbe7e6e79182d64c11971" ON "bids" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_87d008de75691af12328192894" ON "bids" ("loadId", "truckOwnerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "auction_watches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auctionId" uuid NOT NULL, "watcherId" uuid NOT NULL, "tenantId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "notificationPreferences" jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_fb5486c2c9378395a86bcbf9de5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e7bddc41671772b45a3d803db9" ON "auction_watches" ("auctionId", "watcherId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2a437a014d28a2a3002a1fc9f5" ON "auction_watches" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0a77b37e42f5e73befbce3eda1" ON "auction_watches" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9f9960cdacdc7629eab791a240" ON "auction_watches" ("watcherId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d3760adc87d5ee1caf1c68ca97" ON "auction_watches" ("auctionId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'auctions_auctiontype_enum',
      `'REVERSE', 'FORWARD', 'DUTCH', 'SEALED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'auctions_status_enum',
      `'SCHEDULED', 'ACTIVE', 'CLOSED', 'CANCELLED', 'PAUSED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "auctionType" "public"."auctions_auctiontype_enum" NOT NULL DEFAULT 'REVERSE', "status" "public"."auctions_status_enum" NOT NULL DEFAULT 'SCHEDULED', "auctionStart" TIMESTAMP WITH TIME ZONE NOT NULL, "auctionEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "reservePrice" numeric(15,2), "minimumBidIncrement" numeric(15,2), "maximumBidAmount" numeric(15,2), "totalBids" integer NOT NULL DEFAULT '0', "uniqueBidders" integer NOT NULL DEFAULT '0', "currentHighestBid" numeric(15,2), "winningBidId" uuid, "winningBidderId" uuid, "awardedAt" TIMESTAMP WITH TIME ZONE, "auctionRules" jsonb NOT NULL DEFAULT '{}', "notificationSettings" jsonb NOT NULL DEFAULT '{}', "analytics" jsonb NOT NULL DEFAULT '{}', "cancellationReason" text, "cancelledBy" uuid, "cancelledAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "REL_0e1f240cbe7467e649e0a22f97" UNIQUE ("loadId"), CONSTRAINT "REL_f56f0d097f1fb02c07d6bdc368" UNIQUE ("winningBidId"), CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0e1f240cbe7467e649e0a22f97" ON "auctions" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fb8b133ab3e0a013ca99505f43" ON "auctions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d542e114a40757d15e1aefb200" ON "auctions" ("auctionEnd") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e17cdf3e807d07e9717e40bcd0" ON "auctions" ("auctionStart") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fb8b133ab3e0a013ca99505f43" ON "auctions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0e1f240cbe7467e649e0a22f97" ON "auctions" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "auction_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auctionId" uuid NOT NULL, "viewerId" uuid NOT NULL, "tenantId" uuid NOT NULL, "viewedAt" TIMESTAMP NOT NULL DEFAULT now(), "ipAddress" character varying(45), "userAgent" text, "referrer" text, "sessionId" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_11cf1335814dc1c0628d5ab7325" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_a81d93c5706529dad43990e4a3" ON "auction_views" ("auctionId", "viewerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6ba6f1abf7f0d88715b9333193" ON "auction_views" ("viewedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_99e1486bde8f40ada60dc84559" ON "auction_views" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e6b9cee53d8f990822f329ee23" ON "auction_views" ("viewerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2fd049894571ed29326f6d1e66" ON "auction_views" ("auctionId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'users_role_enum',
      `'SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 'TRUCK_OWNER', 'DRIVER', 'AGENT', 'LENDER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'users_status_enum',
      `'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "email" character varying NOT NULL, "phone" character varying, "passwordHash" character varying NOT NULL, "emailVerifiedAt" TIMESTAMP, "phoneVerifiedAt" TIMESTAMP, "twoFactorEnabled" boolean NOT NULL DEFAULT false, "twoFactorSecret" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CARGO_OWNER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION', "lastLoginAt" TIMESTAMP, "loginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_019a1bfe83abbfab615a3c3ef9" ON "users" ("tenantId", "email") WHERE deleted_at IS NULL`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_scores_category_enum',
      `'financial_health', 'transaction_history', 'payment_behavior', 'cargo_quality', 'communication_score', 'reliability_score', 'overall_credit_score'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_scores_algorithm_enum',
      `'financial_analysis', 'behavioral_pattern', 'risk_assessment', 'comprehensive'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "category" "public"."user_scores_category_enum" NOT NULL, "score" numeric(5,2) NOT NULL, "normalizedScore" numeric(5,2) NOT NULL, "algorithm" "public"."user_scores_algorithm_enum" NOT NULL, "factors" jsonb NOT NULL, "metadata" jsonb, "explanation" text, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_caf56c8fd1af4eeddd1aee555ae" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_ratings_ratingtype_enum',
      `'transporter', 'financing_community', 'platform'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_ratings_category_enum',
      `'reliability', 'payment_punctuality', 'communication', 'cargo_condition', 'professionalism', 'overall'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ratedUserId" character varying NOT NULL, "raterUserId" character varying NOT NULL, "ratingType" "public"."user_ratings_ratingtype_enum" NOT NULL, "category" "public"."user_ratings_category_enum" NOT NULL, "rating" numeric(3,2) NOT NULL, "comment" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9de3e405c7a1a3a8ce4c0715993" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_rewards_type_enum',
      `'transaction_bonus', 'volume_bonus', 'loyalty_points', 'cashback', 'discount', 'premium_features'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'user_rewards_status_enum',
      `'pending', 'active', 'redeemed', 'expired'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" "public"."user_rewards_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'KES', "description" text NOT NULL, "status" "public"."user_rewards_status_enum" NOT NULL DEFAULT 'pending', "validFrom" date, "validUntil" date, "criteria" jsonb, "metadata" jsonb, "redeemedAt" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86078010f64a891601beef7c54f" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trucks_fueltype_enum',
      `'DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID', 'CNG', 'LNG'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trucks_trucktype_enum',
      `'FLATBED', 'BOX_TRUCK', 'TANKER', 'REFRIGERATED', 'CONTAINER', 'CAR_CARRIER', 'HEAVY_HAUL', 'LOWBED', 'STEP_DECK', 'POWER_ONLY', 'CURTAIN_SIDE', 'VAN', 'PLATFORM', 'BULK', 'DUMP', 'CEMENT_MIXER', 'CRANE', 'FIRE_TRUCK', 'AMBULANCE', 'TOW_TRUCK', 'GARBAGE', 'MILITARY', 'SPECIALIZED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trucks_trailertype_enum',
      `'FLATBED', 'DRY_VAN', 'REFRIGERATED', 'TANKER', 'BULK', 'CONTAINER', 'CAR_CARRIER', 'HEAVY_HAUL', 'LOWBED', 'STEP_DECK', 'POWER_ONLY', 'CURTAIN_SIDE', 'PLATFORM', 'DUMP', 'CEMENT_MIXER', 'CRANE', 'SPECIALIZED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trucks_status_enum',
      `'AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "trucks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "ownerId" uuid NOT NULL, "plateNumber" character varying(20) NOT NULL, "vin" character varying(17) NOT NULL, "make" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "year" integer NOT NULL, "color" character varying(50), "fuelType" "public"."trucks_fueltype_enum" NOT NULL DEFAULT 'DIESEL', "capacityWeight" numeric(10,2) NOT NULL, "capacityVolume" numeric(10,2) NOT NULL, "maxLength" numeric(8,2), "maxWidth" numeric(8,2), "maxHeight" numeric(8,2), "truckType" "public"."trucks_trucktype_enum" NOT NULL DEFAULT 'FLATBED', "trailerType" "public"."trucks_trailertype_enum", "hasSideRails" boolean NOT NULL DEFAULT false, "hasTarps" boolean NOT NULL DEFAULT false, "hasStraps" boolean NOT NULL DEFAULT false, "hasChains" boolean NOT NULL DEFAULT false, "hasWinch" boolean NOT NULL DEFAULT false, "hasRam" boolean NOT NULL DEFAULT false, "hasTailLift" boolean NOT NULL DEFAULT false, "hasSideLift" boolean NOT NULL DEFAULT false, "hasRollerBed" boolean NOT NULL DEFAULT false, "hasDropDeck" boolean NOT NULL DEFAULT false, "hasExtendable" boolean NOT NULL DEFAULT false, "hasLowbed" boolean NOT NULL DEFAULT false, "hasStepDeck" boolean NOT NULL DEFAULT false, "hasPowerOnly" boolean NOT NULL DEFAULT false, "hasContainerChassis" boolean NOT NULL DEFAULT false, "hasTanker" boolean NOT NULL DEFAULT false, "hasBulk" boolean NOT NULL DEFAULT false, "hasRefrigerated" boolean NOT NULL DEFAULT false, "hasHeated" boolean NOT NULL DEFAULT false, "hasVentilated" boolean NOT NULL DEFAULT false, "hasCurtainSide" boolean NOT NULL DEFAULT false, "hasBox" boolean NOT NULL DEFAULT false, "hasVan" boolean NOT NULL DEFAULT false, "hasPlatform" boolean NOT NULL DEFAULT false, "hasCarCarrier" boolean NOT NULL DEFAULT false, "hasHeavyHaul" boolean NOT NULL DEFAULT false, "hasOversized" boolean NOT NULL DEFAULT false, "hasHazmat" boolean NOT NULL DEFAULT false, "hasDangerousGoods" boolean NOT NULL DEFAULT false, "hasFoodGrade" boolean NOT NULL DEFAULT false, "hasPharmaceutical" boolean NOT NULL DEFAULT false, "hasLiquid" boolean NOT NULL DEFAULT false, "hasDryBulk" boolean NOT NULL DEFAULT false, "hasGas" boolean NOT NULL DEFAULT false, "hasChemical" boolean NOT NULL DEFAULT false, "hasWaste" boolean NOT NULL DEFAULT false, "hasReefer" boolean NOT NULL DEFAULT false, "hasFrozen" boolean NOT NULL DEFAULT false, "hasChilled" boolean NOT NULL DEFAULT false, "hasAmbient" boolean NOT NULL DEFAULT false, "hasControlledAtmosphere" boolean NOT NULL DEFAULT false, "hasHumidityControl" boolean NOT NULL DEFAULT false, "hasTemperatureMonitoring" boolean NOT NULL DEFAULT false, "hasGPS" boolean NOT NULL DEFAULT false, "hasTracking" boolean NOT NULL DEFAULT false, "hasTelematics" boolean NOT NULL DEFAULT false, "hasELD" boolean NOT NULL DEFAULT false, "hasDashCam" boolean NOT NULL DEFAULT false, "hasSafetyCameras" boolean NOT NULL DEFAULT false, "hasCollisionAvoidance" boolean NOT NULL DEFAULT false, "hasLaneDeparture" boolean NOT NULL DEFAULT false, "hasAdaptiveCruise" boolean NOT NULL DEFAULT false, "hasBlindSpot" boolean NOT NULL DEFAULT false, "hasBackupCamera" boolean NOT NULL DEFAULT false, "hasTirePressureMonitoring" boolean NOT NULL DEFAULT false, "hasEngineMonitoring" boolean NOT NULL DEFAULT false, "hasFuelMonitoring" boolean NOT NULL DEFAULT false, "hasMaintenanceAlerts" boolean NOT NULL DEFAULT false, "hasDriverMonitoring" boolean NOT NULL DEFAULT false, "hasFatigueMonitoring" boolean NOT NULL DEFAULT false, "hasSpeedMonitoring" boolean NOT NULL DEFAULT false, "hasIdleMonitoring" boolean NOT NULL DEFAULT false, "hasRouteOptimization" boolean NOT NULL DEFAULT false, "hasRealTimeTracking" boolean NOT NULL DEFAULT false, "hasGeofencing" boolean NOT NULL DEFAULT false, "hasTemperatureAlerts" boolean NOT NULL DEFAULT false, "hasHumidityAlerts" boolean NOT NULL DEFAULT false, "hasShockMonitoring" boolean NOT NULL DEFAULT false, "hasTiltMonitoring" boolean NOT NULL DEFAULT false, "hasDoorMonitoring" boolean NOT NULL DEFAULT false, "hasCargoMonitoring" boolean NOT NULL DEFAULT false, "hasWeightMonitoring" boolean NOT NULL DEFAULT false, "hasVolumeMonitoring" boolean NOT NULL DEFAULT false, "hasPressureMonitoring" boolean NOT NULL DEFAULT false, "hasFlowMonitoring" boolean NOT NULL DEFAULT false, "hasLevelMonitoring" boolean NOT NULL DEFAULT false, "hasQualityMonitoring" boolean NOT NULL DEFAULT false, "hasContaminationMonitoring" boolean NOT NULL DEFAULT false, "hasLeakDetection" boolean NOT NULL DEFAULT false, "hasOverfillProtection" boolean NOT NULL DEFAULT false, "hasEmergencyShutdown" boolean NOT NULL DEFAULT false, "hasFireSuppression" boolean NOT NULL DEFAULT false, "hasExplosionProof" boolean NOT NULL DEFAULT false, "hasCorrosionResistant" boolean NOT NULL DEFAULT false, "hasStainlessSteel" boolean NOT NULL DEFAULT false, "hasAluminum" boolean NOT NULL DEFAULT false, "hasCarbonSteel" boolean NOT NULL DEFAULT false, "hasFiberglass" boolean NOT NULL DEFAULT false, "hasPlastic" boolean NOT NULL DEFAULT false, "hasComposite" boolean NOT NULL DEFAULT false, "hasInsulated" boolean NOT NULL DEFAULT false, "cargoCapabilities" jsonb NOT NULL DEFAULT '{}', "loadingCapabilities" jsonb NOT NULL DEFAULT '{}', "securityFeatures" jsonb NOT NULL DEFAULT '{}', "certifications" jsonb NOT NULL DEFAULT '{}', "routeCapabilities" jsonb NOT NULL DEFAULT '{}', "costStructure" jsonb NOT NULL DEFAULT '{}', "status" "public"."trucks_status_enum" NOT NULL DEFAULT 'AVAILABLE', "currentLocation" geometry(Point,4326), "locationUpdatedAt" TIMESTAMP, "registrationNumber" character varying(50) NOT NULL, "registrationExpiry" date NOT NULL, "insurancePolicy" character varying(50) NOT NULL, "insuranceExpiry" date NOT NULL, "roadworthyCertExpiry" date, "hasRefrigeration" boolean NOT NULL DEFAULT false, "hasLiftGate" boolean NOT NULL DEFAULT false, "hasGps" boolean NOT NULL DEFAULT false, "hasHazmatPermit" boolean NOT NULL DEFAULT false, "equipmentList" jsonb NOT NULL DEFAULT '[]', "lastMaintenanceDate" date, "nextMaintenanceDate" date, "mileage" integer NOT NULL DEFAULT '0', "maintenanceAlerts" jsonb NOT NULL DEFAULT '[]', "assignedDrivers" jsonb NOT NULL DEFAULT '[]', "assignedRoutes" jsonb NOT NULL DEFAULT '[]', "totalTrips" integer NOT NULL DEFAULT '0', "totalRevenue" numeric(15,2) NOT NULL DEFAULT '0', "fuelEfficiency" numeric(8,2), "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "currentDriverId" uuid, "currentTripId" uuid, "estimatedAvailableTime" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_9f46d9e4e1c02f40880e9afbebc" UNIQUE ("vin"), CONSTRAINT "PK_6a134fb7caa4fb476d8a6e035f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b85b6cfda27dd5fafdbb41c66f" ON "trucks" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6dd25f279d65cf40f903d973dd" ON "trucks" ("ownerId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_0ab497cdb0d3e2da3b58f5f704" ON "trucks" ("tenantId", "plateNumber") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "address" text NOT NULL, "cityId" integer, "postalCode" character varying, "city" character varying, "state" character varying, "country" character varying, "region" character varying, "district" character varying, "neighborhood" character varying, "landmark" character varying, "locationCategory" character varying, "locationSubCategory" character varying, "businessHours" character varying, "timezone" character varying, "accessType" character varying, "parkingAvailable" boolean, "securityLevel" character varying, "loadingDockCount" integer, "maxTruckHeight" integer, "maxTruckWeight" integer, "specialInstructions" character varying, "coordinates" geometry(Point,4326), "locationType" character varying NOT NULL DEFAULT 'GENERAL', "contactInfo" jsonb NOT NULL DEFAULT '{}', "operatingHours" jsonb NOT NULL DEFAULT '{}', "facilities" jsonb NOT NULL DEFAULT '{}', "accessInstructions" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8f971e1da13366f71646fc6bbf" ON "locations" ("locationCategory") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_348a97014da2b7290999da1164" ON "locations" ("locationType") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_776c71c455d5d5ae9f0acadffc" ON "locations" ("tenantId", "cityId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'drivers_employmenttype_enum',
      `'FULL_TIME', 'PART_TIME', 'CONTRACT', 'OWNER_OPERATOR', 'FREELANCE'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'drivers_status_enum',
      `'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED', 'IN_TRANSIT'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "drivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "employerId" uuid NOT NULL, "employeeId" character varying, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "dateOfBirth" date NOT NULL, "address" text NOT NULL, "emergencyContact" jsonb NOT NULL DEFAULT '{}', "licenseNumber" character varying(50) NOT NULL, "licenseClasses" jsonb NOT NULL DEFAULT '[]', "licenseIssueDate" date NOT NULL, "licenseExpiry" date NOT NULL, "licenseState" character varying(50) NOT NULL, "licenseCountry" character varying(50) NOT NULL, "endorsements" jsonb NOT NULL DEFAULT '[]', "restrictions" jsonb NOT NULL DEFAULT '[]', "employmentType" "public"."drivers_employmenttype_enum" NOT NULL DEFAULT 'FULL_TIME', "hireDate" date NOT NULL, "terminationDate" date, "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'ACTIVE', "availabilityStatus" character varying NOT NULL DEFAULT 'AVAILABLE', "currentTruckId" uuid, "currentTripId" uuid, "currentLocation" geometry(Point,4326), "locationUpdatedAt" TIMESTAMP, "hoursWorkedThisWeek" numeric(5,2) NOT NULL DEFAULT '0', "hoursWorkedThisMonth" numeric(5,2) NOT NULL DEFAULT '0', "lastBreakTime" TIMESTAMP, "consecutiveDrivingHours" integer NOT NULL DEFAULT '0', "medicalCertExpiry" date, "drugTestDate" date, "backgroundCheckDate" date, "trainingCompletionDate" date, "certifications" jsonb NOT NULL DEFAULT '[]', "rating" numeric(3,2) NOT NULL DEFAULT '0', "totalTrips" integer NOT NULL DEFAULT '0', "totalDistance" numeric(12,2) NOT NULL DEFAULT '0', "safetyScore" numeric(5,2) NOT NULL DEFAULT '100', "onTimeDeliveryRate" numeric(5,2) NOT NULL DEFAULT '0', "hourlyRate" numeric(10,2), "mileageRate" numeric(10,2), "totalEarnings" numeric(15,2) NOT NULL DEFAULT '0', "preferences" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_754b3d50a8cc64f7ad5c24f62b4" UNIQUE ("licenseNumber"), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a335af7dcef374c98a7a81d463" ON "drivers" ("status", "availabilityStatus") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_57d866371f392f459cd9ee46f6" ON "drivers" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7b40fafe4cb4c9db5345858a3e" ON "drivers" ("tenantId", "employerId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_baea09a6daa36c25bc1f321699" ON "drivers" ("licenseNumber") WHERE deleted_at IS NULL`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trips_status_enum',
      `'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "loadId" uuid NOT NULL, "truckId" uuid NOT NULL, "driverId" uuid NOT NULL, "tripNumber" character varying(50) NOT NULL, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'PLANNED', "plannedStartTime" TIMESTAMP WITH TIME ZONE NOT NULL, "plannedEndTime" TIMESTAMP WITH TIME ZONE NOT NULL, "actualStartTime" TIMESTAMP WITH TIME ZONE, "estimatedEndTime" TIMESTAMP WITH TIME ZONE, "actualEndTime" TIMESTAMP WITH TIME ZONE, "plannedRoute" jsonb, "actualRoute" jsonb, "totalDistance" numeric(10,2), "agreedPrice" numeric(15,2) NOT NULL, "currencyCode" character varying(3) NOT NULL DEFAULT 'USD', "fuelCost" numeric(10,2), "tollsCost" numeric(10,2), "otherExpenses" numeric(10,2), "totalCost" numeric(15,2), "profitMargin" numeric(5,2), "fuelEfficiency" numeric(8,2), "averageSpeed" numeric(8,2), "onTimePerformance" boolean, "eta" TIMESTAMP WITH TIME ZONE, "distance" double precision, "duration" double precision, "currentLocation" geometry(Point,4326), "locationUpdatedAt" TIMESTAMP, "estimatedArrival" TIMESTAMP WITH TIME ZONE, "cargoOwnerRating" numeric(3,2), "cargoOwnerFeedback" character varying, "driverRating" numeric(3,2), "driverFeedback" character varying, "notes" character varying, "issuesReported" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, "deleted_at" TIMESTAMP, "pickupLocationId" uuid, "deliveryLocationId" uuid, CONSTRAINT "UQ_47c934ba14c7f8893184544f865" UNIQUE ("tripNumber"), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_136c6d2f593525643465ac88a3" ON "trips" ("plannedStartTime") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e0f832a00dd67ffbb07cc0f7bc" ON "trips" ("truckId", "driverId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e09340a38a920ef5d5cc1d9cb7" ON "trips" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_33bf2bc56e89d2831a5a070a67" ON "trips" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_47c934ba14c7f8893184544f86" ON "trips" ("tripNumber") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tracking_events_type_enum',
      `'Location', 'GeofenceEnter', 'GeofenceExit', 'Delay', 'Incident', 'StatusChange', 'DocumentUpload', 'Alert'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tracking_events_geofencetype_enum',
      `'pickup', 'delivery', 'custom', 'restricted'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tracking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "type" "public"."tracking_events_type_enum" NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "speedKph" numeric(5,2), "headingDeg" numeric(5,2), "accuracyM" numeric(5,2), "altitude" numeric(5,2), "altitudeAccuracy" numeric(5,2), "address" text, "city" text, "state" text, "country" text, "postalCode" text, "geofenceId" text, "geofenceType" "public"."tracking_events_geofencetype_enum", "geofenceName" text, "data" jsonb, "description" text, "notes" text, "reportedBy" uuid, "isAutomated" boolean NOT NULL DEFAULT false, "requiresAction" boolean NOT NULL DEFAULT false, "actionTakenAt" TIMESTAMP WITH TIME ZONE, "actionTakenBy" uuid, "actionTaken" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_cc22ae68e05d9ba5a6575a6f429" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a409b6270ed1bfc522ab31d898" ON "tracking_events" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c6bd59f488e37653f66b02599f" ON "tracking_events" ("loadId", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d62b1710396e4e118bdc877e5f" ON "tracking_events" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c8c82b37aeb9e8533d1d8cc47e" ON "tracking_events" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a409b6270ed1bfc522ab31d898" ON "tracking_events" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "route_trucks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "routeId" uuid NOT NULL, "truckId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_468d75203232a52d433c4eb12b0" UNIQUE ("tenantId", "routeId", "truckId"), CONSTRAINT "PK_eb8d8d94a28bcfe6d970802e578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_941d32f73977001a50bf372375" ON "route_trucks" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_041e5b92be1fd246f112c85e41" ON "route_trucks" ("truckId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_09edcc3902bee3dcf05426e3d2" ON "route_trucks" ("routeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_941d32f73977001a50bf372375" ON "route_trucks" ("tenantId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'routes_routetype_enum',
      `'highway', 'city', 'rural', 'mixed'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'routes_status_enum',
      `'active', 'inactive', 'maintenance'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "routes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, "origin" character varying(100) NOT NULL, "destination" character varying(100) NOT NULL, "distance" numeric(10,2) NOT NULL, "estimatedTime" integer NOT NULL, "routeType" "public"."routes_routetype_enum" NOT NULL DEFAULT 'highway', "status" "public"."routes_status_enum" NOT NULL DEFAULT 'active', "assignedTrucks" jsonb NOT NULL DEFAULT '[]', "assignedDrivers" jsonb NOT NULL DEFAULT '[]', "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_93e4f782932b7c0a332ab3d3cf" ON "routes" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_6d53c760355b9723023759f004" ON "routes" ("tenantId", "name") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "revokedAt" TIMESTAMP, "revokedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'price_suggestions_pricingmodel_enum',
      `'market_rate', 'distance_based', 'weight_based', 'volume_based', 'time_based', 'demand_based', 'competitive', 'custom'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'price_suggestions_confidencelevel_enum',
      `'low', 'medium', 'high', 'very_high'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'price_suggestions_status_enum',
      `'draft', 'active', 'expired', 'accepted', 'rejected', 'superseded'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "price_suggestions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "pricingModel" "public"."price_suggestions_pricingmodel_enum" NOT NULL DEFAULT 'market_rate', "suggestedAmount" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "confidence" numeric(3,2) NOT NULL, "confidenceLevel" "public"."price_suggestions_confidencelevel_enum" NOT NULL DEFAULT 'medium', "status" "public"."price_suggestions_status_enum" NOT NULL DEFAULT 'draft', "minAmount" numeric(15,2), "maxAmount" numeric(15,2), "baseRate" numeric(15,2), "fuelSurcharge" numeric(15,2), "accessorials" numeric(15,2), "taxes" numeric(15,2), "insurance" numeric(15,2), "markup" numeric(15,2), "discount" numeric(15,2), "distanceMiles" numeric(10,2), "distanceKm" numeric(10,2), "estimatedHours" numeric(10,2), "tolls" numeric(10,2), "parking" numeric(10,2), "marketDemand" numeric(5,2), "capacityUtilization" numeric(5,2), "fuelPrice" numeric(5,2), "seasonalFactor" numeric(5,2), "competitorLow" numeric(15,2), "competitorHigh" numeric(15,2), "competitorAverage" numeric(15,2), "competitorCount" integer, "weightFactor" numeric(10,2), "volumeFactor" numeric(10,2), "urgencyFactor" numeric(10,2), "specialHandlingFactor" numeric(10,2), "hazmatFactor" numeric(10,2), "temperatureFactor" numeric(10,2), "inputs" jsonb, "calculationSteps" jsonb, "marketData" jsonb, "notes" text, "reasoning" text, "assumptions" text, "limitations" text, "recommendations" text, "validFrom" TIMESTAMP WITH TIME ZONE, "validUntil" TIMESTAMP WITH TIME ZONE, "acceptedAt" TIMESTAMP WITH TIME ZONE, "acceptedBy" uuid, "rejectedAt" TIMESTAMP WITH TIME ZONE, "rejectedBy" uuid, "rejectionReason" text, "metadata" jsonb, "externalReference" text, "externalSystem" text, "isAutomated" boolean NOT NULL DEFAULT false, "automationSource" text, "processingTimeMs" numeric(5,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_d520dc9638dcf235b80e6f23186" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3cdb9a8e7d235c139d64966279" ON "price_suggestions" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0713a9b6c88a666629a6b9124e" ON "price_suggestions" ("loadId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8a9c3a4224d38b3efa4d6d1ee5" ON "price_suggestions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2a553e06185295514ff6639a24" ON "price_suggestions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1e1c07d344e91d59d80214fa1b" ON "price_suggestions" ("pricingModel") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3cdb9a8e7d235c139d64966279" ON "price_suggestions" ("loadId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'payments_paymentmethod_enum',
      `'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash', 'check', 'wire_transfer'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'payments_paymenttype_enum',
      `'trip_payment', 'subscription', 'service_fee', 'deposit', 'refund', 'withdrawal', 'advance', 'final'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'payments_status_enum',
      `'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'escrow'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotencyKey" character varying, "tenantId" uuid NOT NULL, "tripId" uuid NOT NULL, "payerId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "paymentType" "public"."payments_paymenttype_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "description" character varying, "referenceNumber" character varying, "transactionId" character varying, "gatewayResponse" character varying, "failureReason" character varying, "billingAddress" character varying, "notes" character varying, "dueDate" TIMESTAMP, "processedAt" TIMESTAMP, "processingFee" numeric(10,2), "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8277a466232344577740a61344" ON "payments" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_401cbc3402dbd4d592c82365d7" ON "payments" ("paymentMethod") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9df83c18a025ec22d4f99f80b4" ON "payments" ("tenantId", "tripId") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2ecfa961f2f3e33fff8e19b6c7" ON "password_reset_tokens" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `,
    );
    // Drop notification enums to ensure they are recreated with correct values
    await queryRunner.query('DROP TYPE IF EXISTS "public"."notifications_entitytype_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."notifications_notificationtype_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."notifications_category_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."notifications_priority_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."notifications_status_enum" CASCADE');
    await this.createTypeIfNotExists(
      queryRunner,
      'notifications_entitytype_enum',
      `'USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 'COMPANY', 'TENANT', 'SYSTEM', 'DOCUMENT', 'PAYMENT', 'EXPENSE'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notifications_notificationtype_enum',
      `'SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE', 'SYSTEM_ERROR', 'USER_WELCOME', 'USER_VERIFICATION', 'USER_PASSWORD_RESET', 'USER_ACCOUNT_LOCKED', 'DRIVER_ASSIGNMENT', 'DRIVER_TRIP_START', 'DRIVER_TRIP_END', 'DRIVER_ALERT', 'DRIVER_DOCUMENT_EXPIRY', 'DRIVER_SAFETY_ALERT', 'DRIVER_FATIGUE_WARNING', 'VEHICLE_MAINTENANCE_DUE', 'VEHICLE_INSPECTION_DUE', 'VEHICLE_INSURANCE_EXPIRY', 'VEHICLE_REGISTRATION_EXPIRY', 'VEHICLE_BREAKDOWN', 'CARGO_PICKUP_REMINDER', 'CARGO_DELIVERY_UPDATE', 'CARGO_DELAY', 'CARGO_DAMAGE', 'CARGO_CUSTOMS_UPDATE', 'TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'TRIP_DELAY', 'TRIP_ROUTE_CHANGE', 'TRIP_UPDATE', 'TRIP_STATUS', 'PAYMENT_RECEIVED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'INVOICE_GENERATED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'PAYMENT', 'LICENSE_EXPIRY', 'CERTIFICATION_EXPIRY', 'INSURANCE_EXPIRY', 'PERMIT_EXPIRY', 'AUDIT_DUE', 'VIOLATION_ALERT', 'CONTRACT_EXPIRY', 'AGREEMENT_UPDATE', 'POLICY_CHANGE', 'NEW_FEATURE', 'EMERGENCY_ALERT', 'ACCIDENT_REPORT', 'WEATHER_WARNING', 'ROAD_CLOSURE', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'GENERAL', 'REMINDER', 'ALERT', 'INFO'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notifications_category_enum',
      `'SYSTEM', 'USER', 'DRIVER', 'VEHICLE', 'CARGO', 'TRIP', 'TRIP_STATUS', 'FINANCIAL', 'COMPLIANCE', 'BUSINESS', 'EMERGENCY', 'GENERAL', 'SAFETY', 'PERFORMANCE', 'MAINTENANCE', 'MARKETING'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notifications_priority_enum',
      `'LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notifications_status_enum',
      `'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED'`,
    );
    await queryRunner.query('DROP TABLE IF EXISTS "notifications" CASCADE');
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "recipientId" uuid NOT NULL, "entityType" "public"."notifications_entitytype_enum" NOT NULL, "entityId" uuid, "notificationType" "public"."notifications_notificationtype_enum" NOT NULL, "category" "public"."notifications_category_enum" NOT NULL, "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'NORMAL', "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'PENDING', "title" text NOT NULL, "message" text NOT NULL, "shortMessage" text, "channels" jsonb NOT NULL DEFAULT '[]', "channelData" jsonb NOT NULL DEFAULT '{}', "metadata" jsonb NOT NULL DEFAULT '{}', "tags" jsonb NOT NULL DEFAULT '[]', "scheduledAt" TIMESTAMP, "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "readAt" TIMESTAMP, "expiresAt" TIMESTAMP, "isRead" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "requiresAction" boolean NOT NULL DEFAULT false, "actionUrl" text, "actionText" text, "actionData" jsonb NOT NULL DEFAULT '{}', "attachments" jsonb NOT NULL DEFAULT '[]', "deliveryAttempts" jsonb NOT NULL DEFAULT '{}', "userPreferences" jsonb NOT NULL DEFAULT '{}', "analytics" jsonb NOT NULL DEFAULT '{}', "relatedNotifications" jsonb NOT NULL DEFAULT '[]', "workflowInfo" jsonb NOT NULL DEFAULT '{}', "escalationInfo" jsonb NOT NULL DEFAULT '{}', "complianceInfo" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")); COMMENT ON COLUMN "notifications"."entityType" IS 'Type of entity this notification is related to'; COMMENT ON COLUMN "notifications"."notificationType" IS 'Specific type of notification'; COMMENT ON COLUMN "notifications"."category" IS 'Category of notification for grouping'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_308682392d14d98044e5b83ce0" ON "notifications" ("createdAt", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ab221329a9f4c2111690d52f34" ON "notifications" ("scheduledAt", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1943870d1428ea81b65bc8da7b" ON "notifications" ("tenantId", "recipientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_db8d3f73a58b39fc0c14302840" ON "notifications" ("category", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_13c6c844995d9cc303e7e05087" ON "notifications" ("notificationType", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_797841712968aa775af0cb0b54" ON "notifications" ("entityType", "entityId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ad5fa6719b3f85494d88af4a40" ON "notifications" ("recipientId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "load_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "templateData" jsonb NOT NULL, "createdBy" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "usageCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_89833bd8dda8e54f607e020c48f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ee4d275174d88815c2c790f3e9" ON "load_templates" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bc954d3f801a7247cf678b4a9f" ON "load_templates" ("createdBy") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3cf85c3f2499a0a4ddf6101e82" ON "load_templates" ("tenantId", "createdBy") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_claims_claimtype_enum" AS ENUM('collision', 'cargo_damage', 'theft', 'weather', 'liability', 'medical', 'roadside', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_claims_status_enum" AS ENUM('pending', 'investigating', 'approved', 'denied', 'closed', 'under_review')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_claims_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "insurance_claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "claimNumber" character varying NOT NULL, "policyId" uuid NOT NULL, "truckId" uuid NOT NULL, "claimType" "public"."insurance_claims_claimtype_enum" NOT NULL, "description" text NOT NULL, "incidentDate" date NOT NULL, "reportedDate" date NOT NULL, "estimatedAmount" numeric(15,2) NOT NULL, "approvedAmount" numeric(15,2), "paidAmount" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."insurance_claims_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."insurance_claims_priority_enum" NOT NULL DEFAULT 'medium', "adjuster" json, "notes" json, "documents" json, "location" json, "witnesses" json, "policeReport" json, "repairEstimates" json, "timeline" json, "settlement" json, "appeal" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber"), CONSTRAINT "PK_c6f7929fdcec8c17a24034a48d3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7c69728b0eee8df90aa28cb3aa" ON "insurance_claims" ("claimNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ef0233f5751c8f5bb838dcc9c5" ON "insurance_claims" ("policyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_58b6d392b802763fda1b8cdd21" ON "insurance_claims" ("truckId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cb231129fd839fedfd64b36b0b" ON "insurance_claims" ("incidentDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0f1bdfd84b52e5650828ee105d" ON "insurance_claims" ("reportedDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6a368689710b119486785bf8cc" ON "insurance_claims" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_policies_policytype_enum" AS ENUM('liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_policies_status_enum" AS ENUM('active', 'pending', 'expired', 'cancelled', 'suspended')`,
    );
    await queryRunner.query(`DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'insurance_policies_paymentmethod_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."insurance_policies_paymentmethod_enum" AS ENUM('monthly', 'quarterly', 'annually', 'lump_sum');
    END IF;
END$$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "insurance_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "policyNumber" character varying NOT NULL, "truckId" uuid NOT NULL, "insuranceCompany" character varying NOT NULL, "policyType" "public"."insurance_policies_policytype_enum" NOT NULL, "coverageAmount" numeric(15,2) NOT NULL, "premium" numeric(15,2) NOT NULL, "deductible" numeric(15,2) NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."insurance_policies_status_enum" NOT NULL DEFAULT 'pending', "coverageTypes" text, "autoRenew" boolean NOT NULL DEFAULT false, "notes" text, "documents" json, "agent" json, "paymentMethod" "public"."insurance_policies_paymentmethod_enum" NOT NULL DEFAULT 'monthly', "lastPaymentDate" date, "nextPaymentDate" date, "claimsCount" integer NOT NULL DEFAULT '0', "totalClaimsAmount" numeric(15,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber"), CONSTRAINT "PK_69af1d3a19277d1a822c9b13bf1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_baa50eb26aac0be1b692c080fb" ON "insurance_policies" ("policyNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_acda968d16da059e4f09824655" ON "insurance_policies" ("truckId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e18ea109a1f68c3868b032a089" ON "insurance_policies" ("insuranceCompany") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f3c89f740731a501a18912bd0b" ON "insurance_policies" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b23aa47a8f12016a210e5ac33c" ON "insurance_policies" ("endDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1592f9cf82406fbce791f0f19a" ON "insurance_policies" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_renewals_status_enum" AS ENUM('pending', 'urgent', 'completed', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "insurance_renewals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "renewalNumber" character varying NOT NULL, "policyId" uuid NOT NULL, "truckId" uuid NOT NULL, "currentPolicyEndDate" date NOT NULL, "renewalDate" date NOT NULL, "status" "public"."insurance_renewals_status_enum" NOT NULL DEFAULT 'pending', "currentPremium" numeric(15,2) NOT NULL, "estimatedPremium" numeric(15,2), "finalPremium" numeric(15,2), "autoRenew" boolean NOT NULL DEFAULT false, "coverageChanges" json, "renewalTerms" json NOT NULL, "agent" json, "customerResponse" json, "documents" json, "reminders" json, "timeline" json, "notes" json, "riskAssessment" json, "competitorQuotes" json, "finalDecision" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e2b6bf8bb5605165c05fc9a719" UNIQUE ("renewalNumber"), CONSTRAINT "PK_f10727c57b6bff9ab8d6eefb0ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6e2b6bf8bb5605165c05fc9a71" ON "insurance_renewals" ("renewalNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_febfac3b7bf38da9b119fa050a" ON "insurance_renewals" ("policyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4443a0125e443faf35976c0d07" ON "insurance_renewals" ("truckId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0768b1b477d6f9e590fc86aadd" ON "insurance_renewals" ("currentPolicyEndDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_842fba233d89f76938fdcb1cd0" ON "insurance_renewals" ("renewalDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_54c3d5907c87c8b44f4f962600" ON "insurance_renewals" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3d1613f95c6a564a3b588d161ae" UNIQUE ("token"), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_973ceb9e119e69f5b42fbfa44a" ON "email_verification_tokens" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_3d1613f95c6a564a3b588d161a" ON "email_verification_tokens" ("token") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'disputes_status_enum',
      `'OPEN', 'RESOLVED', 'ESCALATED', 'REJECTED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "disputes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "tripId" uuid NOT NULL, "raisedById" uuid NOT NULL, "status" "public"."disputes_status_enum" NOT NULL DEFAULT 'OPEN', "reason" text NOT NULL, "resolution" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3c97580d01c1a4b0b345c42a107" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f591a79141f5e603d8e6b10db1" ON "disputes" ("tripId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4a1758baf97d7cf6d77d75620f" ON "disputes" ("tenantId", "status") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'documents_entitytype_enum',
      `'USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 'COMPANY', 'TENANT', 'SYSTEM'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'documents_documenttype_enum',
      `'DRIVER_LICENSE', 'DRIVER_MEDICAL_CERT', 'DRIVER_DRUG_TEST', 'DRIVER_BACKGROUND_CHECK', 'DRIVER_TRAINING_CERT', 'DRIVER_INSURANCE', 'VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 'VEHICLE_INSPECTION', 'VEHICLE_MAINTENANCE', 'VEHICLE_PERMIT', 'CARGO_MANIFEST', 'CARGO_INSURANCE', 'CARGO_CUSTOMS', 'CARGO_WEIGHT_CERT', 'BUSINESS_LICENSE', 'BUSINESS_INSURANCE', 'BUSINESS_TAX_CERT', 'BUSINESS_PERMIT', 'USER_ID_PROOF', 'USER_ADDRESS_PROOF', 'USER_BANK_DETAILS', 'TRIP_PERMIT', 'TRIP_ROUTE_PLAN', 'TRIP_WEIGHT_TICKET', 'POD', 'INVOICE', 'RECEIPT', 'PAYMENT_PROOF', 'EXPENSE_RECEIPT', 'SAFETY_CERT', 'ENVIRONMENTAL_CERT', 'QUALITY_CERT', 'CONTRACT', 'AGREEMENT', 'POLICY', 'MANUAL', 'OTHER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'documents_category_enum',
      `'IDENTITY', 'LICENSE', 'INSURANCE', 'CERTIFICATION', 'COMPLIANCE', 'FINANCIAL', 'OPERATIONAL', 'LEGAL', 'OTHER'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'documents_status_enum',
      `'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'ARCHIVED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'documents_priority_enum',
      `'LOW', 'NORMAL', 'HIGH', 'URGENT'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "entityType" "public"."documents_entitytype_enum" NOT NULL, "entityId" uuid NOT NULL, "documentType" "public"."documents_documenttype_enum" NOT NULL, "category" "public"."documents_category_enum" NOT NULL, "status" "public"."documents_status_enum" NOT NULL DEFAULT 'PENDING', "priority" "public"."documents_priority_enum" NOT NULL DEFAULT 'NORMAL', "documentNumber" character varying, "title" text NOT NULL, "description" text NOT NULL, "fileName" text NOT NULL, "originalFileName" text NOT NULL, "fileUrl" text NOT NULL, "thumbnailUrl" text NOT NULL, "fileSize" integer NOT NULL, "mimeType" character varying NOT NULL, "fileExtension" character varying, "issueDate" date, "expiryDate" date, "isExpired" boolean NOT NULL DEFAULT false, "requiresRenewal" boolean NOT NULL DEFAULT false, "renewalReminderDays" integer NOT NULL DEFAULT '30', "metadata" jsonb NOT NULL DEFAULT '{}', "tags" jsonb NOT NULL DEFAULT '[]', "uploadedBy" uuid NOT NULL, "verifiedBy" uuid, "verifiedAt" TIMESTAMP, "verificationNotes" text, "verificationData" jsonb NOT NULL DEFAULT '{}', "versions" jsonb NOT NULL DEFAULT '[]', "currentVersion" integer NOT NULL DEFAULT '1', "accessControl" jsonb NOT NULL DEFAULT '[]', "auditTrail" jsonb NOT NULL DEFAULT '[]', "isPublic" boolean NOT NULL DEFAULT false, "isConfidential" boolean NOT NULL DEFAULT false, "encryptionKey" character varying, "ocrData" jsonb NOT NULL DEFAULT '{}', "digitalSignature" jsonb NOT NULL DEFAULT '{}', "complianceInfo" jsonb NOT NULL DEFAULT '{}', "workflowInfo" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id")); COMMENT ON COLUMN "documents"."entityType" IS 'Type of entity this document belongs to'; COMMENT ON COLUMN "documents"."documentType" IS 'Specific type of document'; COMMENT ON COLUMN "documents"."category" IS 'Category of document for grouping'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6010dc81933f1fdba08e89f76a" ON "documents" ("uploadedBy", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4655f11878f993987b6c1c3f3d" ON "documents" ("expiryDate", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_26cbb28d32120560be2b429b90" ON "documents" ("tenantId", "entityType") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caecdab3f292c1620e81f8430d" ON "documents" ("category", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cfc95e4fa2aa210b2ac4b359cd" ON "documents" ("documentType", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_95476c2fe1b629671d3e6e7514" ON "documents" ("entityType", "entityId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'audit_logs_action_enum',
      `'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'DISPUTE', 'OTHER'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL DEFAULT 'OTHER', "description" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_807994ae5cd2699bf15832114e" ON "audit_logs" ("tenantId", "action") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'audit_events_entitytype_enum',
      `'load', 'document', 'tracking', 'alert', 'bid', 'trip'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'audit_events_action_enum',
      `'create', 'update', 'delete', 'publish', 'assign', 'start', 'deliver', 'cancel', 'repost', 'status_change', 'document_upload', 'document_delete', 'location_update', 'pricing_update', 'alert_create', 'alert_update', 'tracking_update', 'bulk_operation'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "entityType" "public"."audit_events_entitytype_enum" NOT NULL DEFAULT 'load', "entityId" uuid, "action" "public"."audit_events_action_enum" NOT NULL, "actorId" uuid NOT NULL, "actorName" text, "actorEmail" text, "actorRole" text, "description" text, "reason" text, "before" jsonb, "after" jsonb, "changes" jsonb, "metadata" jsonb, "ipAddress" text, "userAgent" text, "sessionId" text, "requestId" text, "externalReference" text, "externalSystem" text, "isAutomated" boolean NOT NULL DEFAULT false, "automationSource" text, "relatedEntities" jsonb, "notes" text, "tags" text, "isSensitive" boolean NOT NULL DEFAULT false, "requiresReview" boolean NOT NULL DEFAULT false, "reviewedBy" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fe948a2ef9575a943c46a916f5" ON "audit_events" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9e76ea4cc84a0e407c5a3aeb05" ON "audit_events" ("actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3a68652a2168db305c9e592b84" ON "audit_events" ("loadId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7f51b93a1819ea59b9df7d9855" ON "audit_events" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9e76ea4cc84a0e407c5a3aeb05" ON "audit_events" ("actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_68d908019304f757740bc47a0a" ON "audit_events" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_03dea5ad2fc208f12145bd5b99" ON "audit_events" ("entityType") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fe948a2ef9575a943c46a916f5" ON "audit_events" ("loadId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'alerts_type_enum',
      `'Delay', 'RouteDeviation', 'Incident', 'TemperatureExcursion', 'CustomsHold', 'MechanicalIssue', 'WeatherDelay', 'TrafficDelay', 'SecurityIssue', 'Other'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'alerts_severity_enum',
      `'Low', 'Medium', 'High', 'Critical'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'alerts_status_enum',
      `'open', 'acknowledged', 'in_progress', 'resolved', 'closed'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "type" "public"."alerts_type_enum" NOT NULL, "description" text NOT NULL, "severity" "public"."alerts_severity_enum" NOT NULL DEFAULT 'Medium', "status" "public"."alerts_status_enum" NOT NULL DEFAULT 'open', "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "acknowledgedAt" TIMESTAMP WITH TIME ZONE, "acknowledgedBy" uuid, "resolvedAt" TIMESTAMP WITH TIME ZONE, "resolvedBy" uuid, "closedAt" TIMESTAMP WITH TIME ZONE, "closedBy" uuid, "resolutionNotes" text, "actionTaken" text, "metadata" jsonb, "location" jsonb, "estimatedDelayHours" numeric(5,2), "estimatedResolutionTime" text, "contactPerson" text, "contactPhone" text, "contactEmail" text, "requiresImmediateAction" boolean NOT NULL DEFAULT false, "isEscalated" boolean NOT NULL DEFAULT false, "escalatedAt" TIMESTAMP WITH TIME ZONE, "escalatedTo" uuid, "escalationReason" text, "attachments" jsonb, "externalReference" text, "externalSystem" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_143edd01c2f285d77e22f36a31" ON "alerts" ("loadId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8bb8f7c97396b99b57794c5999" ON "alerts" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_619841f80de96e6b1f03ecc8e5" ON "alerts" ("loadId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b63189bf8e5abf5b9188acca96" ON "alerts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f206618be4e26b7c883e9899ba" ON "alerts" ("severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b5262085cf88e336618af2cc68" ON "alerts" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_143edd01c2f285d77e22f36a31" ON "alerts" ("loadId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loan_requests_status_enum',
      `'pending', 'approved', 'rejected', 'disbursed', 'repaid', 'failed', 'defaulted'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "loan_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cargo_id" uuid NOT NULL, "trip_id" uuid NOT NULL, "lender_id" uuid, "requested_amount" numeric(15,2) NOT NULL, "approved_amount" numeric(15,2), "status" "public"."loan_requests_status_enum" NOT NULL DEFAULT 'pending', "idempotency_key" character varying(255) NOT NULL, "interest_amount" numeric(15,2), "due_date" date, "created_by" uuid NOT NULL, "borrower_id" uuid, "external_loan_ref" character varying(255), "rejection_reason" text, "requested_split" json, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5f2d8564e7eb4d695c072376958" UNIQUE ("idempotency_key"), CONSTRAINT "PK_52d5943f8adea74332d5d53ec6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "loan_repayments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loan_request_id" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "interest_paid" numeric(15,2) NOT NULL, "principal_paid" numeric(15,2) NOT NULL, "repayment_date" TIMESTAMP NOT NULL, "external_txn_ref" character varying(255), "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4de4c026e1722acfd6d25a1e153" UNIQUE ("external_txn_ref"), CONSTRAINT "PK_a37968e2dcfb72f910f5480cc16" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loan_disbursements_status_enum',
      `'initiated', 'success', 'failed', 'pending', 'approved', 'disbursed', 'rejected', 'on_hold'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loan_disbursements_priority_enum',
      `'urgent', 'high', 'medium', 'low'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'loan_disbursements_disbursement_method_enum',
      `'bank_transfer', 'check', 'escrow', 'digital_wallet'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "loan_disbursements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loan_request_id" uuid NOT NULL, "disbursement_date" TIMESTAMP, "beneficiaries" json NOT NULL, "status" "public"."loan_disbursements_status_enum" NOT NULL DEFAULT 'initiated', "external_txn_ref" character varying(255), "attempts" integer NOT NULL DEFAULT '0', "failure_reason" text, "next_retry_at" TIMESTAMP, "amount" numeric(15,2), "priority" "public"."loan_disbursements_priority_enum" NOT NULL DEFAULT 'medium', "documents" jsonb, "risk_score" numeric(3,1), "credit_score" integer, "collateral_value" numeric(15,2), "disbursement_method" "public"."loan_disbursements_disbursement_method_enum" NOT NULL DEFAULT 'bank_transfer', "notes" text, "purpose" character varying(500), "interest_rate" numeric(5,2), "term_months" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9165b079d61baa9724c985f6723" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'lenders_status_enum',
      `'active', 'paused', 'suspended'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lenders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "api_key_hash" character varying(500) NOT NULL, "callback_url" character varying(500), "outbound_api_key_encrypted" character varying(1000), "webhook_secret_encrypted" character varying(1000), "contact_email" character varying(255) NOT NULL, "status" "public"."lenders_status_enum" NOT NULL DEFAULT 'active', "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dec2ebd30bfaed645ddcb20229f" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'lender_permissions_category_enum',
      `'loans', 'borrowers', 'analytics', 'settings', 'compliance', 'financial'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'lender_permissions_level_enum',
      `'read', 'write', 'admin'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "category" "public"."lender_permissions_category_enum" NOT NULL, "level" "public"."lender_permissions_level_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_131b00b78e946b5f87d385cadb3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "level" integer NOT NULL DEFAULT '1', "is_custom" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4cf15e96ddeef469b699677803" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'lender_users_status_enum',
      `'active', 'inactive', 'pending', 'suspended'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "password_hash" character varying(255) NOT NULL, "lender_id" uuid NOT NULL, "role_id" uuid NOT NULL, "status" "public"."lender_users_status_enum" NOT NULL DEFAULT 'pending', "department" character varying(100), "avatar" character varying(500), "created_by" character varying(255) NOT NULL, "last_login" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3d8ef2c048340ec8452f926463" UNIQUE ("email"), CONSTRAINT "PK_0f9a636a7e5548d25866703dfb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "interest_rate" numeric(5,4) NOT NULL, "repayment_term_days" integer NOT NULL, "max_advance_per_trip" numeric(15,2) NOT NULL, "max_exposure" numeric(15,2) NOT NULL, "advance_percentage" numeric(5,4) NOT NULL DEFAULT '0.7', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_832872e4152c496a12d35ca547f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "borrowers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "company_name" character varying(255) NOT NULL, "contact_name" character varying(255), "email" character varying(255), "phone" character varying(20), "business_type" character varying(100), "registration_number" character varying(100), "address" text, "credit_score" integer, "status" character varying(20) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_81e4cddf7ab4dbd5e79a8f84031" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "trip_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" character varying NOT NULL, "driverId" character varying NOT NULL, "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "altitude" numeric(5,2), "speed" numeric(5,2), "heading" numeric(5,2), "accuracy" numeric(5,2), "batteryLevel" numeric(5,2), "isMoving" boolean NOT NULL DEFAULT false, "metadata" jsonb, "timestamp" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f053370498ff61658917241d211" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_66a4fdd8f06d536dc5ef659e8f" ON "trip_locations" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_74f23daf6f2604f0adabfcac58" ON "trip_locations" ("driverId", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_78ec5cd2f445dee8ae15338ba5" ON "trip_locations" ("tripId", "timestamp") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trip_events_type_enum',
      `'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'PICKUP_ARRIVED', 'PICKUP_COMPLETED', 'DELIVERY_ARRIVED', 'DELIVERY_COMPLETED', 'ROUTE_DEVIATION', 'ETA_UPDATED', 'WEATHER_UPDATE', 'TRAFFIC_UPDATE', 'FUEL_STOP', 'REST_STOP', 'MAINTENANCE_STOP', 'CUSTOMER_CONTACT', 'DOCUMENT_UPLOADED', 'SIGNATURE_COLLECTED'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'trip_events_severity_enum',
      `'INFO', 'WARNING', 'ERROR', 'CRITICAL'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "trip_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" character varying NOT NULL, "driverId" character varying NOT NULL, "type" "public"."trip_events_type_enum" NOT NULL, "severity" "public"."trip_events_severity_enum" NOT NULL DEFAULT 'INFO', "title" character varying NOT NULL, "description" text NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "speed" numeric(5,2), "data" jsonb, "requiresAcknowledgment" boolean NOT NULL DEFAULT false, "acknowledgedAt" TIMESTAMP, "acknowledgedBy" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df6ea3b2ad6f86f525d796220da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bd901edc39205134d03cb76535" ON "trip_events" ("type", "severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3589adc3f99b4733fba9b3b311" ON "trip_events" ("driverId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3267692da4aac579792dabc4a2" ON "trip_events" ("tripId", "type") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'geofences_type_enum',
      `'PICKUP', 'DELIVERY', 'RESTRICTED', 'CUSTOM'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "geofences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "type" "public"."geofences_type_enum" NOT NULL DEFAULT 'CUSTOM', "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "radius" numeric(8,2) NOT NULL, "polygon" jsonb, "isActive" boolean NOT NULL DEFAULT true, "settings" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c858c4e20c26a6e5b2a1a10c82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_41f05d0ab196734c957a5f94c5" ON "geofences" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_5bb1f8300c1aa9af9f2773237c" ON "geofences" ("type", "isActive") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'driver_alerts_type_enum',
      `'SPEEDING', 'HARD_BRAKING', 'HARD_ACCELERATION', 'SHARP_TURN', 'IDLE_TIME', 'OFF_ROUTE', 'EMERGENCY', 'BATTERY_LOW', 'GEOFENCE_VIOLATION', 'WEATHER_ALERT', 'MAINTENANCE_ALERT'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'driver_alerts_severity_enum',
      `'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'driver_alerts_status_enum',
      `'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "driver_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverId" character varying NOT NULL, "tripId" character varying, "type" "public"."driver_alerts_type_enum" NOT NULL, "severity" "public"."driver_alerts_severity_enum" NOT NULL DEFAULT 'MEDIUM', "status" "public"."driver_alerts_status_enum" NOT NULL DEFAULT 'ACTIVE', "title" character varying NOT NULL, "message" text NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "speed" numeric(5,2), "data" jsonb, "acknowledgedAt" TIMESTAMP, "acknowledgedBy" character varying, "resolvedAt" TIMESTAMP, "resolvedBy" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28b35bf619e38d94c3f53c495c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9fb62928ec18d06acd906abe59" ON "driver_alerts" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_876df290ec8bb81ffa45901b5a" ON "driver_alerts" ("type", "severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8f0b90cfcb9a320d316c792f60" ON "driver_alerts" ("tripId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2d1bc20ea70fb8d1fb8ea6eb51" ON "driver_alerts" ("driverId", "status") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_predictions_status_enum',
      `'pending', 'processed', 'failed', 'validated', 'rejected'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "pricing_predictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "modelId" uuid NOT NULL, "tripId" uuid, "loadId" uuid, "truckId" uuid, "driverId" uuid, "status" "public"."pricing_predictions_status_enum" NOT NULL DEFAULT 'pending', "distance" numeric(10,2) NOT NULL, "weight" numeric(10,2) NOT NULL, "volume" numeric(10,2) NOT NULL, "originLocation" character varying(255) NOT NULL, "destinationLocation" character varying(255) NOT NULL, "routeComplexity" jsonb NOT NULL, "marketConditions" jsonb NOT NULL, "truckAvailability" jsonb NOT NULL, "driverMetrics" jsonb NOT NULL, "environmentalFactors" jsonb NOT NULL, "temporalFeatures" jsonb NOT NULL, "cargoFeatures" jsonb NOT NULL, "predictedPrice" numeric(12,2) NOT NULL, "actualPrice" numeric(12,2), "predictionAccuracy" numeric(10,2), "predictionError" numeric(10,2), "confidenceInterval" numeric(12,2) NOT NULL, "featureContributions" jsonb NOT NULL, "shapValues" jsonb NOT NULL, "limeExplanation" jsonb NOT NULL, "inferenceTime" numeric(10,4) NOT NULL, "modelVersion" jsonb NOT NULL, "isAccepted" boolean NOT NULL DEFAULT false, "isRejected" boolean NOT NULL DEFAULT false, "rejectionReason" character varying(255), "acceptedPrice" numeric(12,2), "acceptedAt" TIMESTAMP, "acceptedBy" character varying(255), "abTestGroup" character varying(50), "isABTest" boolean NOT NULL DEFAULT false, "biasMetrics" jsonb, "isAnomaly" boolean NOT NULL DEFAULT false, "anomalyScore" numeric(10,4), "driftMetrics" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "predictedAt" TIMESTAMP, "validatedAt" TIMESTAMP, CONSTRAINT "PK_08c32e60bd43778416f424e5701" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_33d10083cddf802f824f537e86" ON "pricing_predictions" ("predictedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_812cb7cef1a3b868ec9aeb532a" ON "pricing_predictions" ("tripId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f87cff4fc4d3a190d5ad231b4a" ON "pricing_predictions" ("modelId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bfb0f932879521ce30397dd1be" ON "pricing_predictions" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7bf38a558895c578d35ea19a94" ON "pricing_predictions" ("tenantId", "modelId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_models_modeltype_enum',
      `'linear_regression', 'random_forest', 'gradient_boosting', 'neural_network', 'ensemble', 'custom'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_models_version_enum',
      `'v1.0', 'v1.1', 'v2.0', 'v2.1', 'beta'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_models_status_enum',
      `'training', 'active', 'inactive', 'deprecated', 'failed'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "pricing_models" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, "modelType" "public"."pricing_models_modeltype_enum" NOT NULL DEFAULT 'gradient_boosting', "version" "public"."pricing_models_version_enum" NOT NULL DEFAULT 'v1.0', "status" "public"."pricing_models_status_enum" NOT NULL DEFAULT 'inactive', "modelPath" character varying(255), "hyperparameters" jsonb, "featureConfig" jsonb, "performanceMetrics" jsonb, "trainingMetrics" jsonb, "biasMetrics" jsonb, "explainabilityMetrics" jsonb, "aBTestConfig" jsonb, "monitoringConfig" jsonb, "lastTrainingDate" TIMESTAMP, "lastInferenceDate" TIMESTAMP, "nextRetrainingDate" TIMESTAMP, "totalInferences" integer NOT NULL DEFAULT '0', "averageInferenceTime" numeric(10,2) NOT NULL DEFAULT '0', "averagePredictionAccuracy" numeric(10,2) NOT NULL DEFAULT '0', "metadata" jsonb, "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d5c719fee2b6e2f857a67fc6b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a5a95c2eb289dbb91ed5399bb9" ON "pricing_models" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_28a3a367424398db63e6cc68a5" ON "pricing_models" ("version", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_5d884262384edc276df2b0ef4b" ON "pricing_models" ("tenantId", "modelType") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_17fe5d255209b618bc0f8c768d" ON "pricing_models" ("tenantId", "status") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_features_featuretype_enum',
      `'numerical', 'categorical', 'temporal', 'geospatial', 'text', 'boolean', 'composite'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'pricing_features_featuresource_enum',
      `'trip_data', 'market_data', 'weather_data', 'traffic_data', 'fuel_data', 'driver_data', 'truck_data', 'external_api', 'computed'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "pricing_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "featureName" character varying(255) NOT NULL, "description" character varying(500) NOT NULL, "featureType" "public"."pricing_features_featuretype_enum" NOT NULL DEFAULT 'numerical', "featureSource" "public"."pricing_features_featuresource_enum" NOT NULL DEFAULT 'computed', "dataType" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isRequired" boolean NOT NULL DEFAULT false, "importance" integer NOT NULL DEFAULT '0', "correlationWithTarget" numeric(10,4), "statistics" jsonb, "preprocessing" jsonb, "validation" jsonb, "driftMetrics" jsonb, "biasMetrics" jsonb, "featureEngineering" jsonb, "qualityMetrics" jsonb, "metadata" jsonb, "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a2bc88284be8bf2a98145aacbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_be0cae5943aeb3a2aaa4344ef1" ON "pricing_features" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f39e8d6b34aaaf11c37d3f64bf" ON "pricing_features" ("featureName", "tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_677b7a8c0a08cfa3c23c699d76" ON "pricing_features" ("tenantId", "featureSource") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8eedc2f59890953881e6176186" ON "pricing_features" ("tenantId", "featureType") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notification_templates_type_enum',
      `'email', 'sms', 'push', 'in_app'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notification_templates_category_enum',
      `'trip_status', 'payment', 'safety', 'performance', 'maintenance', 'system', 'marketing'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "notification_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "type" "public"."notification_templates_type_enum" NOT NULL DEFAULT 'email', "category" "public"."notification_templates_category_enum" NOT NULL DEFAULT 'system', "language" character varying(10) NOT NULL DEFAULT 'en', "subject" character varying(255), "content" text NOT NULL, "htmlContent" text, "plainTextContent" text, "variables" jsonb, "defaultValues" jsonb, "branding" jsonb, "metadata" jsonb, "isActive" boolean NOT NULL DEFAULT true, "isDefault" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '0', "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4ec35888951e02b2898f54fd26" ON "notification_templates" ("isActive", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e48756cbf41b42cb414abe1966" ON "notification_templates" ("tenantId", "language") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2191a1db3a22d1d2a8e055601d" ON "notification_templates" ("tenantId", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a1b8057b12c7bf4e7e61856662" ON "notification_templates" ("tenantId", "category") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notification_preferences_category_enum',
      `'trip_status', 'payment', 'safety', 'performance', 'maintenance', 'system', 'marketing'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'notification_preferences_channel_enum',
      `'email', 'sms', 'push', 'in_app'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "category" "public"."notification_preferences_category_enum" NOT NULL DEFAULT 'system', "channel" "public"."notification_preferences_channel_enum" NOT NULL DEFAULT 'email', "isEnabled" boolean NOT NULL DEFAULT true, "emailEnabled" boolean NOT NULL DEFAULT true, "smsEnabled" boolean NOT NULL DEFAULT true, "pushEnabled" boolean NOT NULL DEFAULT true, "inAppEnabled" boolean NOT NULL DEFAULT true, "emailAddress" character varying(255), "phoneNumber" character varying(20), "deviceToken" character varying(255), "language" character varying(10) NOT NULL DEFAULT 'en', "timezone" character varying(10) NOT NULL DEFAULT 'UTC', "quietHours" jsonb, "frequency" jsonb, "priority" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8facef03fbe2ee514e7fe7fe14" ON "notification_preferences" ("userId", "channel") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_90d452c90494da1080c16b52c1" ON "notification_preferences" ("userId", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a2e2691f8172b07d81e0d1e347" ON "notification_preferences" ("tenantId", "userId") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'policy_renewals_status_enum',
      `'pending', 'approved', 'rejected', 'completed', 'cancelled', 'expired', 'urgent'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'policy_renewals_renewaltype_enum',
      `'automatic', 'manual', 'upgrade', 'downgrade', 'transfer'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "policy_renewals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "renewalNumber" character varying(50) NOT NULL, "status" "public"."policy_renewals_status_enum" NOT NULL DEFAULT 'pending', "renewalType" "public"."policy_renewals_renewaltype_enum" NOT NULL DEFAULT 'manual', "currentEndDate" date NOT NULL, "renewalDate" date NOT NULL, "newStartDate" date, "newEndDate" date, "currentPremium" numeric(10,2) NOT NULL, "newPremium" numeric(10,2), "premiumChange" numeric(10,2), "newCoverageAmount" numeric(15,2), "newDeductible" numeric(10,2), "coverageChanges" json, "newCoverageDetails" json, "autoRenew" boolean NOT NULL DEFAULT false, "renewalReason" text, "rejectionReason" text, "notes" text, "documents" json, "reminderSentDate" date, "approvalDate" date, "completionDate" date, "approvedBy" uuid, "policyId" uuid NOT NULL, "tenantId" uuid NOT NULL, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_cd480bbedf6d4b5c314008ff425" UNIQUE ("renewalNumber"), CONSTRAINT "PK_7336e3b1ebee5e7b7617d1ee93a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_150613de3612941b1e1b921e06" ON "policy_renewals" ("renewalDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2be89a736c62dfb88480bb8865" ON "policy_renewals" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6745a98293a7d8dd3948b688e2" ON "policy_renewals" ("policyId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cd480bbedf6d4b5c314008ff42" ON "policy_renewals" ("renewalNumber") `,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'financial_payments_paymentmethod_enum',
      `'check', 'ach', 'credit_card', 'wire', 'cash'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'financial_payments_status_enum',
      `'pending', 'completed', 'failed', 'refunded'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "financial_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceId" character varying NOT NULL, "invoiceNumber" character varying NOT NULL, "customerId" character varying NOT NULL, "customerName" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "paymentDate" TIMESTAMP NOT NULL, "paymentMethod" "public"."financial_payments_paymentmethod_enum" NOT NULL, "referenceNumber" character varying, "status" "public"."financial_payments_status_enum" NOT NULL DEFAULT 'pending', "notes" text, "processingFee" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_519cd663ee123fce8d831033338" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tax_records_type_enum',
      `'ifta', 'fuel_tax', 'income_tax', 'sales_tax'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'tax_records_status_enum',
      `'pending', 'filed', 'paid', 'overdue'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tax_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."tax_records_type_enum" NOT NULL, "period" character varying NOT NULL, "filingDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."tax_records_status_enum" NOT NULL DEFAULT 'pending', "jurisdiction" character varying NOT NULL, "referenceNumber" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_db43e50fbb0fd5cc693e5f61eee" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'invoices_status_enum',
      `'draft', 'sent', 'paid', 'overdue', 'cancelled'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "customerId" character varying NOT NULL, "customerName" character varying NOT NULL, "tripId" character varying, "truckId" character varying, "driverId" character varying, "issueDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft', "subtotal" numeric(10,2) NOT NULL, "taxAmount" numeric(10,2) NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "notes" text, "paymentTerms" character varying NOT NULL DEFAULT 'Net 30', "paymentMethod" character varying, "paidDate" TIMESTAMP, "lateFees" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'invoice_items_type_enum',
      `'freight', 'fuel_surcharge', 'toll', 'detention', 'lumper', 'accessorial'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "type" "public"."invoice_items_type_enum" NOT NULL, "tripId" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "invoiceId" uuid, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'expenses_type_enum',
      `'fuel', 'maintenance', 'toll', 'driver', 'insurance', 'tax', 'other'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'expenses_status_enum',
      `'pending', 'approved', 'rejected', 'paid'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."expenses_type_enum" NOT NULL, "category" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "date" TIMESTAMP NOT NULL, "description" character varying NOT NULL, "truckId" character varying, "driverId" character varying, "tripId" character varying, "receipt" character varying, "status" "public"."expenses_status_enum" NOT NULL DEFAULT 'pending', "approvedBy" character varying, "approvedDate" TIMESTAMP, "notes" text, "taxDeductible" boolean NOT NULL DEFAULT true, "allocationCustomerId" character varying, "allocationTripId" character varying, "allocationPercentage" numeric(5,2) NOT NULL DEFAULT '100', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'financial_reports_type_enum',
      `'pl_statement', 'cash_flow', 'revenue', 'expense', 'profitability'`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'financial_reports_period_enum',
      `'daily', 'weekly', 'monthly', 'quarterly', 'yearly'`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "financial_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."financial_reports_type_enum" NOT NULL, "period" "public"."financial_reports_period_enum" NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "data" json NOT NULL, "generatedAt" TIMESTAMP NOT NULL, "generatedBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_4dd23f1aa1f11c233bad2937702" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "year" integer NOT NULL, "month" integer, "category" character varying NOT NULL, "plannedAmount" numeric(10,2) NOT NULL, "actualAmount" numeric(10,2) NOT NULL, "variance" numeric(10,2) NOT NULL, "variancePercentage" numeric(5,2) NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_ff6d1f74bc7c2c32132bf363176" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_05f0a14b055bab4011e9b58f09" ON "lender_role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f4803284da86c04ffbab09e0a1" ON "lender_role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lender_user_permissions" ("user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_efe23dd2442a22b29b8c439121f" PRIMARY KEY ("user_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_05f55bf74e2b5ba8b79b6f3b1c" ON "lender_user_permissions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3e247569401d14be97b1d99928" ON "lender_user_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58b6d392b802763fda1b8cdd21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "truckId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjuster"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "witnesses"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "policeReport"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "repairEstimates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "timeline"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "settlement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "appeal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "premium"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "coverageTypes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "agent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "paymentMethod"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "lastPaymentDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "nextPaymentDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "claimsCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "totalClaimsAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "truckId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjuster" json`,
    );
    await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "notes" json`);
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "witnesses" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "policeReport" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "repairEstimates" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "timeline" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "settlement" json`,
    );
    await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "appeal" json`);
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "premium" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "coverageTypes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "agent" json`,
    );
    await queryRunner.query(`DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'insurance_policies_paymentmethod_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."insurance_policies_paymentmethod_enum" AS ENUM('monthly', 'quarterly', 'annually', 'lump_sum');
    END IF;
END$$;`);
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "paymentMethod" "public"."insurance_policies_paymentmethod_enum" NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "lastPaymentDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "nextPaymentDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "claimsCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "totalClaimsAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjusterName" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjusterPhone" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjusterEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjusterNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "investigationNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "denialReason" text`,
    );
    await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "photos" json`);
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "policeReportNumber" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "witnessName" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "witnessPhone" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "witnessStatement" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "isFault" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "faultDescription" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "settlementDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "settlementNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "tenantId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "createdBy" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "assignedTo" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "monthlyPremium" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "coverageDetails" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "exclusions" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "conditions" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "agentName" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "agentPhone" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "agentEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "tenantId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "createdBy" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c69728b0eee8df90aa28cb3aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "claimNumber" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_claims_claimtype_enum" RENAME TO "insurance_claims_claimtype_enum_old"`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'insurance_claims_claimtype_enum',
      `'collision', 'theft', 'vandalism', 'weather_damage', 'cargo_damage', 'cargo_theft', 'fire', 'flood', 'mechanical_breakdown', 'roadside_assistance', 'medical', 'liability', 'other'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "claimType" TYPE "public"."insurance_claims_claimtype_enum" USING "claimType"::"text"::"public"."insurance_claims_claimtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_claimtype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_claims_status_enum" RENAME TO "insurance_claims_status_enum_old"`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'insurance_claims_status_enum',
      `'pending', 'investigating', 'approved', 'denied', 'closed', 'under_review', 'settlement_pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" TYPE "public"."insurance_claims_status_enum" USING "status"::"text"::"public"."insurance_claims_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "location"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "location" character varying(255)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baa50eb26aac0be1b692c080fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "policyNumber" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e18ea109a1f68c3868b032a089"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_policies_policytype_enum" RENAME TO "insurance_policies_policytype_enum_old"`,
    );
    await this.createTypeIfNotExists(
      queryRunner,
      'insurance_policies_policytype_enum',
      `'liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'medical_payments', 'roadside_assistance', 'rental_reimbursement', 'full_coverage', 'commercial'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ALTER COLUMN "policyType" TYPE "public"."insurance_policies_policytype_enum" USING "policyType"::"text"::"public"."insurance_policies_policytype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_policytype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ALTER COLUMN "deductible" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7c69728b0eee8df90aa28cb3aa" ON "insurance_claims" ("claimNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_58b6d392b802763fda1b8cdd21" ON "insurance_claims" ("truckId") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_baa50eb26aac0be1b692c080fb" ON "insurance_policies" ("policyNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e18ea109a1f68c3868b032a089" ON "insurance_policies" ("insuranceCompany") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b8bbfc223669bc00cb06098742" ON "rate_limits" ("tenantId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_282e04b4fee53dc581d40d5df6" ON "rate_limits" ("tenantId", "endpoint", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8e5c713517ab7a21ff3e863ca9" ON "insurance_claims" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_85a9f10e2000f5b9346c385a98" ON "insurance_claims" ("policyId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_390732a304351ba893fb459bbb" ON "insurance_policies" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8ba9f8f6f24babb4e5a4380198" ON "insurance_policies" ("truckId", "status") `,
    );
    
    // Drop all foreign key constraints if they exist before adding them
    // This prevents "constraint already exists" errors on re-runs
    await queryRunner.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT conname, conrelid::regclass AS table_name
                  FROM pg_constraint
                  WHERE contype = 'f'
                  AND connamespace = 'public'::regnamespace)
        LOOP
          EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS "' || r.conname || '" CASCADE';
        END LOOP;
      END $$;
    `);
    
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loads" ADD CONSTRAINT "FK_4bf0030a3bc50c87ee9d62150a2" FOREIGN KEY ("cargoOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bids" ADD CONSTRAINT "FK_d03cf356cf1520672d4488244b7" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bids" ADD CONSTRAINT "FK_0d1ebe448cb691f63a2015d458c" FOREIGN KEY ("truckOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_watches" ADD CONSTRAINT "FK_d3760adc87d5ee1caf1c68ca97c" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_watches" ADD CONSTRAINT "FK_9f9960cdacdc7629eab791a2408" FOREIGN KEY ("watcherId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auctions" ADD CONSTRAINT "FK_0e1f240cbe7467e649e0a22f972" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auctions" ADD CONSTRAINT "FK_f56f0d097f1fb02c07d6bdc368d" FOREIGN KEY ("winningBidId") REFERENCES "bids"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_views" ADD CONSTRAINT "FK_2fd049894571ed29326f6d1e667" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_views" ADD CONSTRAINT "FK_e6b9cee53d8f990822f329ee238" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trucks" ADD CONSTRAINT "FK_6dd25f279d65cf40f903d973dd1" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_b076d66a33644c5f3f35b00342c" FOREIGN KEY ("pickupLocationId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_45e6ba84f89d222f6ec3491b32b" FOREIGN KEY ("deliveryLocationId") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_e09340a38a920ef5d5cc1d9cb7c" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_700f7e9137180e091c2e8343f06" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_fc5a8911f85074a660a4304baa1" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" ADD CONSTRAINT "FK_a409b6270ed1bfc522ab31d8981" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" ADD CONSTRAINT "FK_2d3799e247f548a6b445aa794b8" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" ADD CONSTRAINT "FK_6be8ea49959fe857b2c0c98facc" FOREIGN KEY ("actionTakenBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_trucks" ADD CONSTRAINT "FK_09edcc3902bee3dcf05426e3d2d" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" ADD CONSTRAINT "FK_3cdb9a8e7d235c139d649662792" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" ADD CONSTRAINT "FK_2e06bee7a3b9401f2189535e6f8" FOREIGN KEY ("acceptedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" ADD CONSTRAINT "FK_ddf6e4dedc1cb6a49fb8a565393" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_4277aa2c0e3a4a3591474dbea2f" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "load_templates" ADD CONSTRAINT "FK_bc954d3f801a7247cf678b4a9f5" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_ef0233f5751c8f5bb838dcc9c51" FOREIGN KEY ("policyId") REFERENCES "insurance_policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_58b6d392b802763fda1b8cdd21d" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_acda968d16da059e4f098246552" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_renewals" ADD CONSTRAINT "FK_febfac3b7bf38da9b119fa050ae" FOREIGN KEY ("policyId") REFERENCES "insurance_policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_renewals" ADD CONSTRAINT "FK_4443a0125e443faf35976c0d073" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_8880a40e54bc9b4675323ca102e" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_f591a79141f5e603d8e6b10db11" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD CONSTRAINT "FK_fe948a2ef9575a943c46a916f50" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD CONSTRAINT "FK_9e76ea4cc84a0e407c5a3aeb054" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD CONSTRAINT "FK_b1b19e63b886fdc36c0ebb82def" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_143edd01c2f285d77e22f36a31b" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_c54fca4a363bf6977b1146d6cdf" FOREIGN KEY ("acknowledgedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_42c6341f1c3237def4a2af12424" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_f86b0d6f23d3f1dde6df15df021" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_308bd80c9ad3eaf333a364e533a" FOREIGN KEY ("escalatedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_requests" ADD CONSTRAINT "FK_e9e0a90731bc470fedbbc86ecea" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_requests" ADD CONSTRAINT "FK_aec634ccd19e42612dc7a8f8a8f" FOREIGN KEY ("borrower_id") REFERENCES "borrowers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_repayments" ADD CONSTRAINT "FK_21ef1bd34fb44422d1acce46d20" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_disbursements" ADD CONSTRAINT "FK_080b5296a5d57fceec56f5bbf01" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_users" ADD CONSTRAINT "FK_d041faf14d43d9a3202724c8c7f" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_users" ADD CONSTRAINT "FK_a2659dfe46e333e729ff6f22234" FOREIGN KEY ("role_id") REFERENCES "lender_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_policies" ADD CONSTRAINT "FK_d5433e3c9e1a61a66a2f7b678b0" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_predictions" ADD CONSTRAINT "FK_94966b7fa18a25f9933d266de6c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_models" ADD CONSTRAINT "FK_619a63b581d7dda86a9397ac11f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_features" ADD CONSTRAINT "FK_30a4db7e195d7052044f7e61989" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_templates" ADD CONSTRAINT "FK_53c96a011fdb6f8c6b700c961e4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b3403e8b519a383776f6c693cc9" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_47ae4807b3ed676f608660b8dfa" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_d4e396c5a1c8de48961bdf349a2" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_42c8e0e8ee2e6953e607e7c2daa" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_32881c13a51d3576a0222a6ebde" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_bf04611ec3fbf4d71b9f8515d43" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" ADD CONSTRAINT "FK_33d20468ee0b5047ec0eed6c83c" FOREIGN KEY ("policyId") REFERENCES "insurance_policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" ADD CONSTRAINT "FK_31774d7030411ceefb456f755f7" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" ADD CONSTRAINT "FK_2471353f202ba285efdc86a0e3f" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" ADD CONSTRAINT "FK_52284aca09e41f7c8c1877be93f" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_payments" ADD CONSTRAINT "FK_d54d26d16a013ca9f7aaf39a830" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_payments" ADD CONSTRAINT "FK_63aa462e621b1db98ceb226b49d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" ADD CONSTRAINT "FK_b2849b7dc980ca04e449457399a" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" ADD CONSTRAINT "FK_a3787b66405b239bc4c0cef4948" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_916db332df1248d4325ff4e5016" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_89c82485e364081f457b210120d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_26da15632f6073c3708f6219201" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_f754faa125acaf008866b6635bc" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" ADD CONSTRAINT "FK_0f70431b951afb6b76d37f631ec" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" ADD CONSTRAINT "FK_597a1287239ba4a3fbbec552cfb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_585cf990e152374b53e2f602a41" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_066b8b7c71df90bb31ea952a50d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_role_permissions" ADD CONSTRAINT "FK_05f0a14b055bab4011e9b58f09e" FOREIGN KEY ("role_id") REFERENCES "lender_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_role_permissions" ADD CONSTRAINT "FK_f4803284da86c04ffbab09e0a1e" FOREIGN KEY ("permission_id") REFERENCES "lender_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_user_permissions" ADD CONSTRAINT "FK_05f55bf74e2b5ba8b79b6f3b1c4" FOREIGN KEY ("user_id") REFERENCES "lender_users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_user_permissions" ADD CONSTRAINT "FK_3e247569401d14be97b1d999287" FOREIGN KEY ("permission_id") REFERENCES "lender_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lender_user_permissions" DROP CONSTRAINT "FK_3e247569401d14be97b1d999287"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_user_permissions" DROP CONSTRAINT "FK_05f55bf74e2b5ba8b79b6f3b1c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_role_permissions" DROP CONSTRAINT "FK_f4803284da86c04ffbab09e0a1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_role_permissions" DROP CONSTRAINT "FK_05f0a14b055bab4011e9b58f09e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_066b8b7c71df90bb31ea952a50d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_585cf990e152374b53e2f602a41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" DROP CONSTRAINT "FK_597a1287239ba4a3fbbec552cfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" DROP CONSTRAINT "FK_0f70431b951afb6b76d37f631ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_f754faa125acaf008866b6635bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_26da15632f6073c3708f6219201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_89c82485e364081f457b210120d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_916db332df1248d4325ff4e5016"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" DROP CONSTRAINT "FK_a3787b66405b239bc4c0cef4948"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" DROP CONSTRAINT "FK_b2849b7dc980ca04e449457399a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_payments" DROP CONSTRAINT "FK_63aa462e621b1db98ceb226b49d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_payments" DROP CONSTRAINT "FK_d54d26d16a013ca9f7aaf39a830"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" DROP CONSTRAINT "FK_52284aca09e41f7c8c1877be93f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" DROP CONSTRAINT "FK_2471353f202ba285efdc86a0e3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" DROP CONSTRAINT "FK_31774d7030411ceefb456f755f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_renewals" DROP CONSTRAINT "FK_33d20468ee0b5047ec0eed6c83c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP CONSTRAINT "FK_bf04611ec3fbf4d71b9f8515d43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP CONSTRAINT "FK_32881c13a51d3576a0222a6ebde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "FK_42c8e0e8ee2e6953e607e7c2daa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "FK_d4e396c5a1c8de48961bdf349a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "FK_47ae4807b3ed676f608660b8dfa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b3403e8b519a383776f6c693cc9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b70c44e8b00757584a393225593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_templates" DROP CONSTRAINT "FK_53c96a011fdb6f8c6b700c961e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_features" DROP CONSTRAINT "FK_30a4db7e195d7052044f7e61989"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_models" DROP CONSTRAINT "FK_619a63b581d7dda86a9397ac11f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_predictions" DROP CONSTRAINT "FK_94966b7fa18a25f9933d266de6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_policies" DROP CONSTRAINT "FK_d5433e3c9e1a61a66a2f7b678b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_users" DROP CONSTRAINT "FK_a2659dfe46e333e729ff6f22234"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lender_users" DROP CONSTRAINT "FK_d041faf14d43d9a3202724c8c7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_disbursements" DROP CONSTRAINT "FK_080b5296a5d57fceec56f5bbf01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_repayments" DROP CONSTRAINT "FK_21ef1bd34fb44422d1acce46d20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_requests" DROP CONSTRAINT "FK_aec634ccd19e42612dc7a8f8a8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_requests" DROP CONSTRAINT "FK_e9e0a90731bc470fedbbc86ecea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_308bd80c9ad3eaf333a364e533a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_f86b0d6f23d3f1dde6df15df021"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_42c6341f1c3237def4a2af12424"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_c54fca4a363bf6977b1146d6cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_143edd01c2f285d77e22f36a31b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" DROP CONSTRAINT "FK_b1b19e63b886fdc36c0ebb82def"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" DROP CONSTRAINT "FK_9e76ea4cc84a0e407c5a3aeb054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" DROP CONSTRAINT "FK_fe948a2ef9575a943c46a916f50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_f591a79141f5e603d8e6b10db11"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_8880a40e54bc9b4675323ca102e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_renewals" DROP CONSTRAINT "FK_4443a0125e443faf35976c0d073"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_renewals" DROP CONSTRAINT "FK_febfac3b7bf38da9b119fa050ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP CONSTRAINT "FK_acda968d16da059e4f098246552"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "FK_58b6d392b802763fda1b8cdd21d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "FK_ef0233f5751c8f5bb838dcc9c51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "load_templates" DROP CONSTRAINT "FK_bc954d3f801a7247cf678b4a9f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_4277aa2c0e3a4a3591474dbea2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" DROP CONSTRAINT "FK_ddf6e4dedc1cb6a49fb8a565393"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" DROP CONSTRAINT "FK_2e06bee7a3b9401f2189535e6f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_suggestions" DROP CONSTRAINT "FK_3cdb9a8e7d235c139d649662792"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_trucks" DROP CONSTRAINT "FK_09edcc3902bee3dcf05426e3d2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" DROP CONSTRAINT "FK_6be8ea49959fe857b2c0c98facc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" DROP CONSTRAINT "FK_2d3799e247f548a6b445aa794b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracking_events" DROP CONSTRAINT "FK_a409b6270ed1bfc522ab31d8981"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_fc5a8911f85074a660a4304baa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_700f7e9137180e091c2e8343f06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_e09340a38a920ef5d5cc1d9cb7c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_45e6ba84f89d222f6ec3491b32b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_b076d66a33644c5f3f35b00342c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trucks" DROP CONSTRAINT "FK_6dd25f279d65cf40f903d973dd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_views" DROP CONSTRAINT "FK_e6b9cee53d8f990822f329ee238"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_views" DROP CONSTRAINT "FK_2fd049894571ed29326f6d1e667"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auctions" DROP CONSTRAINT "FK_f56f0d097f1fb02c07d6bdc368d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auctions" DROP CONSTRAINT "FK_0e1f240cbe7467e649e0a22f972"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_watches" DROP CONSTRAINT "FK_9f9960cdacdc7629eab791a2408"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auction_watches" DROP CONSTRAINT "FK_d3760adc87d5ee1caf1c68ca97c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bids" DROP CONSTRAINT "FK_0d1ebe448cb691f63a2015d458c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bids" DROP CONSTRAINT "FK_d03cf356cf1520672d4488244b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loads" DROP CONSTRAINT "FK_4bf0030a3bc50c87ee9d62150a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ba9f8f6f24babb4e5a4380198"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_390732a304351ba893fb459bbb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85a9f10e2000f5b9346c385a98"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e5c713517ab7a21ff3e863ca9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_282e04b4fee53dc581d40d5df6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8bbfc223669bc00cb06098742"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e18ea109a1f68c3868b032a089"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baa50eb26aac0be1b692c080fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58b6d392b802763fda1b8cdd21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c69728b0eee8df90aa28cb3aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ALTER COLUMN "deductible" TYPE numeric(15,2)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_policies_policytype_enum_old" AS ENUM('liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical')`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ALTER COLUMN "policyType" TYPE "public"."insurance_policies_policytype_enum_old" USING "policyType"::"text"::"public"."insurance_policies_policytype_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_policytype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_policies_policytype_enum_old" RENAME TO "insurance_policies_policytype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e18ea109a1f68c3868b032a089" ON "insurance_policies" ("insuranceCompany") `,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "policyNumber" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_baa50eb26aac0be1b692c080fb" ON "insurance_policies" ("policyNumber") `,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "location"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "location" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_claims_status_enum_old" AS ENUM('pending', 'investigating', 'approved', 'denied', 'closed', 'under_review')`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" TYPE "public"."insurance_claims_status_enum_old" USING "status"::"text"::"public"."insurance_claims_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_claims_status_enum_old" RENAME TO "insurance_claims_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."insurance_claims_claimtype_enum_old" AS ENUM('collision', 'cargo_damage', 'theft', 'weather', 'liability', 'medical', 'roadside', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ALTER COLUMN "claimType" TYPE "public"."insurance_claims_claimtype_enum_old" USING "claimType"::"text"::"public"."insurance_claims_claimtype_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_claimtype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."insurance_claims_claimtype_enum_old" RENAME TO "insurance_claims_claimtype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "claimNumber" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7c69728b0eee8df90aa28cb3aa" ON "insurance_claims" ("claimNumber") `,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "agentEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "agentPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "agentName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "conditions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "exclusions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "coverageDetails"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "monthlyPremium"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "assignedTo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "settlementNotes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "settlementDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "faultDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "isFault"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "witnessStatement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "witnessPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "witnessName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "policeReportNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "photos"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "denialReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "investigationNotes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjusterNotes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjusterEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjusterPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjusterName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "totalClaimsAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "claimsCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "nextPaymentDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "lastPaymentDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "paymentMethod"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "agent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "coverageTypes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" DROP COLUMN "premium"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "appeal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "settlement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "timeline"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "repairEstimates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "policeReport"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "witnesses"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "adjuster"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" DROP COLUMN "truckId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "totalClaimsAmount" numeric(15,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "claimsCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "nextPaymentDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "lastPaymentDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "paymentMethod" "public"."insurance_policies_paymentmethod_enum" NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "agent" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "coverageTypes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_policies" ADD "premium" numeric(15,2) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "appeal" json`);
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "settlement" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "timeline" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "repairEstimates" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "policeReport" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "witnesses" json`,
    );
    await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "notes" json`);
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "adjuster" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "insurance_claims" ADD "truckId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_58b6d392b802763fda1b8cdd21" ON "insurance_claims" ("truckId") `,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e247569401d14be97b1d99928"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05f55bf74e2b5ba8b79b6f3b1c"`,
    );
    await queryRunner.query(`DROP TABLE "lender_user_permissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4803284da86c04ffbab09e0a1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05f0a14b055bab4011e9b58f09"`,
    );
    await queryRunner.query(`DROP TABLE "lender_role_permissions"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "financial_reports"`);
    await queryRunner.query(
      `DROP TYPE "public"."financial_reports_period_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."financial_reports_type_enum"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_type_enum"`);
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TYPE "public"."invoice_items_type_enum"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TABLE "tax_records"`);
    await queryRunner.query(`DROP TYPE "public"."tax_records_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tax_records_type_enum"`);
    await queryRunner.query(`DROP TABLE "financial_payments"`);
    await queryRunner.query(
      `DROP TYPE "public"."financial_payments_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."financial_payments_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd480bbedf6d4b5c314008ff42"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6745a98293a7d8dd3948b688e2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2be89a736c62dfb88480bb8865"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_150613de3612941b1e1b921e06"`,
    );
    await queryRunner.query(`DROP TABLE "policy_renewals"`);
    await queryRunner.query(
      `DROP TYPE "public"."policy_renewals_renewaltype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."policy_renewals_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2e2691f8172b07d81e0d1e347"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_90d452c90494da1080c16b52c1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8facef03fbe2ee514e7fe7fe14"`,
    );
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_preferences_channel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_preferences_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a1b8057b12c7bf4e7e61856662"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2191a1db3a22d1d2a8e055601d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e48756cbf41b42cb414abe1966"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4ec35888951e02b2898f54fd26"`,
    );
    await queryRunner.query(`DROP TABLE "notification_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_templates_category_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_templates_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8eedc2f59890953881e6176186"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_677b7a8c0a08cfa3c23c699d76"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f39e8d6b34aaaf11c37d3f64bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be0cae5943aeb3a2aaa4344ef1"`,
    );
    await queryRunner.query(`DROP TABLE "pricing_features"`);
    await queryRunner.query(
      `DROP TYPE "public"."pricing_features_featuresource_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."pricing_features_featuretype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17fe5d255209b618bc0f8c768d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d884262384edc276df2b0ef4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28a3a367424398db63e6cc68a5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5a95c2eb289dbb91ed5399bb9"`,
    );
    await queryRunner.query(`DROP TABLE "pricing_models"`);
    await queryRunner.query(`DROP TYPE "public"."pricing_models_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pricing_models_version_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."pricing_models_modeltype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7bf38a558895c578d35ea19a94"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bfb0f932879521ce30397dd1be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f87cff4fc4d3a190d5ad231b4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_812cb7cef1a3b868ec9aeb532a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_33d10083cddf802f824f537e86"`,
    );
    await queryRunner.query(`DROP TABLE "pricing_predictions"`);
    await queryRunner.query(
      `DROP TYPE "public"."pricing_predictions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d1bc20ea70fb8d1fb8ea6eb51"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f0b90cfcb9a320d316c792f60"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_876df290ec8bb81ffa45901b5a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fb62928ec18d06acd906abe59"`,
    );
    await queryRunner.query(`DROP TABLE "driver_alerts"`);
    await queryRunner.query(`DROP TYPE "public"."driver_alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."driver_alerts_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."driver_alerts_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5bb1f8300c1aa9af9f2773237c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_41f05d0ab196734c957a5f94c5"`,
    );
    await queryRunner.query(`DROP TABLE "geofences"`);
    await queryRunner.query(`DROP TYPE "public"."geofences_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3267692da4aac579792dabc4a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3589adc3f99b4733fba9b3b311"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd901edc39205134d03cb76535"`,
    );
    await queryRunner.query(`DROP TABLE "trip_events"`);
    await queryRunner.query(`DROP TYPE "public"."trip_events_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trip_events_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78ec5cd2f445dee8ae15338ba5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_74f23daf6f2604f0adabfcac58"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66a4fdd8f06d536dc5ef659e8f"`,
    );
    await queryRunner.query(`DROP TABLE "trip_locations"`);
    await queryRunner.query(`DROP TABLE "borrowers"`);
    await queryRunner.query(`DROP TABLE "lender_policies"`);
    await queryRunner.query(`DROP TABLE "lender_users"`);
    await queryRunner.query(`DROP TYPE "public"."lender_users_status_enum"`);
    await queryRunner.query(`DROP TABLE "lender_roles"`);
    await queryRunner.query(`DROP TABLE "lender_permissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."lender_permissions_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lender_permissions_category_enum"`,
    );
    await queryRunner.query(`DROP TABLE "lenders"`);
    await queryRunner.query(`DROP TYPE "public"."lenders_status_enum"`);
    await queryRunner.query(`DROP TABLE "loan_disbursements"`);
    await queryRunner.query(
      `DROP TYPE "public"."loan_disbursements_disbursement_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."loan_disbursements_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."loan_disbursements_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "loan_repayments"`);
    await queryRunner.query(`DROP TABLE "loan_requests"`);
    await queryRunner.query(`DROP TYPE "public"."loan_requests_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_143edd01c2f285d77e22f36a31"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5262085cf88e336618af2cc68"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f206618be4e26b7c883e9899ba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b63189bf8e5abf5b9188acca96"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_619841f80de96e6b1f03ecc8e5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8bb8f7c97396b99b57794c5999"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_143edd01c2f285d77e22f36a31"`,
    );
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "public"."alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alerts_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alerts_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe948a2ef9575a943c46a916f5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03dea5ad2fc208f12145bd5b99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_68d908019304f757740bc47a0a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e76ea4cc84a0e407c5a3aeb05"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f51b93a1819ea59b9df7d9855"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a68652a2168db305c9e592b84"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e76ea4cc84a0e407c5a3aeb05"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe948a2ef9575a943c46a916f5"`,
    );
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(`DROP TYPE "public"."audit_events_action_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."audit_events_entitytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_807994ae5cd2699bf15832114e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_95476c2fe1b629671d3e6e7514"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfc95e4fa2aa210b2ac4b359cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_caecdab3f292c1620e81f8430d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26cbb28d32120560be2b429b90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4655f11878f993987b6c1c3f3d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6010dc81933f1fdba08e89f76a"`,
    );
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE "public"."documents_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_documenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_entitytype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a1758baf97d7cf6d77d75620f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f591a79141f5e603d8e6b10db1"`,
    );
    await queryRunner.query(`DROP TABLE "disputes"`);
    await queryRunner.query(`DROP TYPE "public"."disputes_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d1613f95c6a564a3b588d161a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_973ceb9e119e69f5b42fbfa44a"`,
    );
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54c3d5907c87c8b44f4f962600"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_842fba233d89f76938fdcb1cd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0768b1b477d6f9e590fc86aadd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4443a0125e443faf35976c0d07"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_febfac3b7bf38da9b119fa050a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6e2b6bf8bb5605165c05fc9a71"`,
    );
    await queryRunner.query(`DROP TABLE "insurance_renewals"`);
    await queryRunner.query(
      `DROP TYPE "public"."insurance_renewals_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1592f9cf82406fbce791f0f19a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23aa47a8f12016a210e5ac33c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3c89f740731a501a18912bd0b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e18ea109a1f68c3868b032a089"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acda968d16da059e4f09824655"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baa50eb26aac0be1b692c080fb"`,
    );
    await queryRunner.query(`DROP TABLE "insurance_policies"`);
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_policies_policytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6a368689710b119486785bf8cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f1bdfd84b52e5650828ee105d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb231129fd839fedfd64b36b0b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58b6d392b802763fda1b8cdd21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef0233f5751c8f5bb838dcc9c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c69728b0eee8df90aa28cb3aa"`,
    );
    await queryRunner.query(`DROP TABLE "insurance_claims"`);
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."insurance_claims_claimtype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cf85c3f2499a0a4ddf6101e82"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc954d3f801a7247cf678b4a9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee4d275174d88815c2c790f3e9"`,
    );
    await queryRunner.query(`DROP TABLE "load_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad5fa6719b3f85494d88af4a40"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_797841712968aa775af0cb0b54"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13c6c844995d9cc303e7e05087"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db8d3f73a58b39fc0c14302840"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1943870d1428ea81b65bc8da7b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab221329a9f4c2111690d52f34"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_308682392d14d98044e5b83ce0"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."notifications_notificationtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notifications_entitytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab673f0e63eac966762155508e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ecfa961f2f3e33fff8e19b6c7"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9df83c18a025ec22d4f99f80b4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_401cbc3402dbd4d592c82365d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8277a466232344577740a61344"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cdb9a8e7d235c139d64966279"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1e1c07d344e91d59d80214fa1b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a553e06185295514ff6639a24"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a9c3a4224d38b3efa4d6d1ee5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0713a9b6c88a666629a6b9124e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cdb9a8e7d235c139d64966279"`,
    );
    await queryRunner.query(`DROP TABLE "price_suggestions"`);
    await queryRunner.query(
      `DROP TYPE "public"."price_suggestions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."price_suggestions_confidencelevel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."price_suggestions_pricingmodel_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d53c760355b9723023759f004"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93e4f782932b7c0a332ab3d3cf"`,
    );
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP TYPE "public"."routes_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."routes_routetype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941d32f73977001a50bf372375"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09edcc3902bee3dcf05426e3d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_041e5b92be1fd246f112c85e41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941d32f73977001a50bf372375"`,
    );
    await queryRunner.query(`DROP TABLE "route_trucks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a409b6270ed1bfc522ab31d898"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8c82b37aeb9e8533d1d8cc47e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d62b1710396e4e118bdc877e5f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6bd59f488e37653f66b02599f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a409b6270ed1bfc522ab31d898"`,
    );
    await queryRunner.query(`DROP TABLE "tracking_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."tracking_events_geofencetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tracking_events_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47c934ba14c7f8893184544f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_33bf2bc56e89d2831a5a070a67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e09340a38a920ef5d5cc1d9cb7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0f832a00dd67ffbb07cc0f7bc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_136c6d2f593525643465ac88a3"`,
    );
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baea09a6daa36c25bc1f321699"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7b40fafe4cb4c9db5345858a3e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57d866371f392f459cd9ee46f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a335af7dcef374c98a7a81d463"`,
    );
    await queryRunner.query(`DROP TABLE "drivers"`);
    await queryRunner.query(`DROP TYPE "public"."drivers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."drivers_employmenttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_776c71c455d5d5ae9f0acadffc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_348a97014da2b7290999da1164"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f971e1da13366f71646fc6bbf"`,
    );
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ab497cdb0d3e2da3b58f5f704"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6dd25f279d65cf40f903d973dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b85b6cfda27dd5fafdbb41c66f"`,
    );
    await queryRunner.query(`DROP TABLE "trucks"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_trailertype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_trucktype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_fueltype_enum"`);
    await queryRunner.query(`DROP TABLE "user_rewards"`);
    await queryRunner.query(`DROP TYPE "public"."user_rewards_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_rewards_type_enum"`);
    await queryRunner.query(`DROP TABLE "user_ratings"`);
    await queryRunner.query(`DROP TYPE "public"."user_ratings_category_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_ratings_ratingtype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "user_scores"`);
    await queryRunner.query(`DROP TYPE "public"."user_scores_algorithm_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_scores_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_019a1bfe83abbfab615a3c3ef9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2fd049894571ed29326f6d1e66"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6b9cee53d8f990822f329ee23"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99e1486bde8f40ada60dc84559"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ba6f1abf7f0d88715b9333193"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a81d93c5706529dad43990e4a3"`,
    );
    await queryRunner.query(`DROP TABLE "auction_views"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0e1f240cbe7467e649e0a22f97"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fb8b133ab3e0a013ca99505f43"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e17cdf3e807d07e9717e40bcd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d542e114a40757d15e1aefb200"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fb8b133ab3e0a013ca99505f43"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0e1f240cbe7467e649e0a22f97"`,
    );
    await queryRunner.query(`DROP TABLE "auctions"`);
    await queryRunner.query(`DROP TYPE "public"."auctions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."auctions_auctiontype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3760adc87d5ee1caf1c68ca97"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f9960cdacdc7629eab791a240"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a77b37e42f5e73befbce3eda1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a437a014d28a2a3002a1fc9f5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7bddc41671772b45a3d803db9"`,
    );
    await queryRunner.query(`DROP TABLE "auction_watches"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87d008de75691af12328192894"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_203fecbe7e6e79182d64c11971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cdded8d682a5e3b1dc092788b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_203fecbe7e6e79182d64c11971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d1ebe448cb691f63a2015d458"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d03cf356cf1520672d4488244b"`,
    );
    await queryRunner.query(`DROP TABLE "bids"`);
    await queryRunner.query(`DROP TYPE "public"."bids_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_61c9fa9c7fa4eddb9dbad3d09d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bf0030a3bc50c87ee9d62150a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5636b0881461b62c4784c63c2d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_18c0c8ba52eb33c51ecc2a3eaf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a53c7fe240b4a67cce9053625e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2147d38f116dcc1d8b49dbfb81"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb60606ade409eb486e4b5ec67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bf0030a3bc50c87ee9d62150a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c205ed8f1c0bde5f883078a8f"`,
    );
    await queryRunner.query(`DROP TABLE "loads"`);
    await queryRunner.query(`DROP TYPE "public"."loads_packagingtype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_urgencylevel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_paymentterms_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_cargotype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_equipmenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_loadtype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d488a84526d22ad2b799829b7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c59559e7872bc9726adef4669f"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8481388d6325e752cd4d7e26c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_207051f533bf9ed05dc96c1f3e"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_profiles_kycstatus_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rate_limits_tenant_createdAt" ON "rate_limits" ("tenantId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rate_limits_tenant_endpoint_createdAt" ON "rate_limits" ("tenantId", "endpoint", "createdAt") `,
    );
  }
}
