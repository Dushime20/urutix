import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMigration1000000000000 implements MigrationInterface {
  name = 'InitMigration1000000000000';
  private hasPostGIS = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tables already exist (from CreateAllTables migration)
    // If they do, skip this migration as it's already been applied
    const tablesExist = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'loads'
      )
    `);
    
    if (tablesExist[0].exists) {
      console.log('⚠️  Tables already exist (likely from CreateAllTables migration). Skipping InitMigration.');
      return;
    }
    
    // Create required extensions first
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Try to create PostGIS extension, but continue if it's not available
    // Use a DO block to handle errors without aborting the transaction
    const postgisResult = await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS "postgis";
        RAISE NOTICE 'PostGIS extension created successfully';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available: %', SQLERRM;
      END $$;
    `);
    
    // Check if PostGIS is actually available by querying for it
    const checkPostGIS = await queryRunner.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
      ) as exists;
    `);
    
    this.hasPostGIS = checkPostGIS[0]?.exists === true;
    
    if (!this.hasPostGIS) {
      console.warn('⚠️  PostGIS extension not available. Using JSONB for location columns.');
    }
    
    // Create enum types only if they don't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_rewards_type_enum') THEN
          CREATE TYPE "public"."user_rewards_type_enum" AS ENUM('transaction_bonus', 'volume_bonus', 'loyalty_points', 'cashback', 'discount', 'premium_features');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_rewards_status_enum') THEN
          CREATE TYPE "public"."user_rewards_status_enum" AS ENUM('pending', 'active', 'redeemed', 'expired');
        END IF;
      END $$;
    `);
    // Check if table exists before creating
    const userRewardsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_rewards'
      )
    `);
    
    if (!userRewardsExists[0].exists) {
      await queryRunner.query(
        `CREATE TABLE "user_rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" "public"."user_rewards_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'KES', "description" text NOT NULL, "status" "public"."user_rewards_status_enum" NOT NULL DEFAULT 'pending', "validFrom" date, "validUntil" date, "criteria" jsonb, "metadata" jsonb, "redeemedAt" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86078010f64a891601beef7c54f" PRIMARY KEY ("id"))`,
      );
    }
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_ratings_ratingtype_enum') THEN
          CREATE TYPE "public"."user_ratings_ratingtype_enum" AS ENUM('transporter', 'financing_community', 'platform');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_ratings_category_enum') THEN
          CREATE TYPE "public"."user_ratings_category_enum" AS ENUM('reliability', 'payment_punctuality', 'communication', 'cargo_condition', 'professionalism', 'overall');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "user_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ratedUserId" character varying NOT NULL, "raterUserId" character varying NOT NULL, "ratingType" "public"."user_ratings_ratingtype_enum" NOT NULL, "category" "public"."user_ratings_category_enum" NOT NULL, "rating" numeric(3,2) NOT NULL, "comment" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9de3e405c7a1a3a8ce4c0715993" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_type_enum') THEN
          CREATE TYPE "public"."tenants_type_enum" AS ENUM('ENTERPRISE', 'SMALL_BUSINESS', 'INDIVIDUAL', 'PARTNER');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_status_enum') THEN
          CREATE TYPE "public"."tenants_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION', 'DEACTIVATED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "subdomain" character varying, "domain" character varying, "type" "public"."tenants_type_enum" NOT NULL DEFAULT 'SMALL_BUSINESS', "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'PENDING_ACTIVATION', "description" character varying, "logoUrl" character varying, "websiteUrl" character varying, "contactEmail" character varying, "contactPhone" character varying, "address" character varying, "city" character varying, "state" character varying, "country" character varying, "postalCode" character varying, "taxId" character varying, "businessLicense" character varying, "settings" jsonb NOT NULL DEFAULT '{}', "features" jsonb NOT NULL DEFAULT '{}', "billingInfo" jsonb NOT NULL DEFAULT '{}', "maxUsers" integer, "maxTrucks" integer, "maxDrivers" integer, "maxLoadsPerMonth" integer, "subscriptionPlan" character varying, "subscriptionExpiresAt" TIMESTAMP, "trialEndsAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT false, "activatedAt" TIMESTAMP, "suspendedAt" TIMESTAMP, "suspendedReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1abfe8dcc106667204ac7aedce" ON "tenants" ("isActive", "subscriptionPlan") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d517a272e11c9cb9847a026ac6" ON "tenants" ("status", "type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d488a84526d22ad2b799829b7d" ON "tenants" ("subdomain") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loads_cargotype_enum') THEN
          CREATE TYPE "public"."loads_cargotype_enum" AS ENUM('GENERAL', 'FRAGILE', 'HAZARDOUS', 'REFRIGERATED', 'LIQUID', 'OVERSIZED', 'VALUABLE');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loads_status_enum') THEN
          CREATE TYPE "public"."loads_status_enum" AS ENUM('DRAFT', 'CREATED', 'PUBLISHED', 'ASSIGNED', 'IN_TRANSIT', 'LOADED', 'DELIVERED', 'CANCELLED', 'COMPLETED');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loads_urgencylevel_enum') THEN
          CREATE TYPE "public"."loads_urgencylevel_enum" AS ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "loads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "cargoOwnerId" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "weight" numeric(10,2) NOT NULL, "volume" numeric(10,2), "cargoType" "public"."loads_cargotype_enum" NOT NULL DEFAULT 'GENERAL', "locations" jsonb NOT NULL DEFAULT '[]', "pickupDate" TIMESTAMP WITH TIME ZONE, "deliveryDate" TIMESTAMP WITH TIME ZONE, "status" "public"."loads_status_enum" NOT NULL DEFAULT 'DRAFT', "loadValue" numeric(15,2) NOT NULL, "offeredPrice" numeric(15,2), "currencyCode" character varying(3) NOT NULL DEFAULT 'USD', "isFragile" boolean NOT NULL DEFAULT false, "isHazardous" boolean NOT NULL DEFAULT false, "requiresRefrigeration" boolean NOT NULL DEFAULT false, "contactInfo" jsonb NOT NULL DEFAULT '{}', "autoMatchEnabled" boolean NOT NULL DEFAULT true, "matchingCriteria" jsonb NOT NULL DEFAULT '{}', "publishedAt" TIMESTAMP, "assignedTruckId" uuid, "rating" numeric(3,2) NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "length" numeric(8,2), "width" numeric(8,2), "height" numeric(8,2), "stackableHeight" numeric(8,2), "isStackable" boolean NOT NULL DEFAULT false, "temperatureMin" numeric(5,2), "temperatureMax" numeric(5,2), "requiresHumidityControl" boolean NOT NULL DEFAULT false, "requiresForklift" boolean NOT NULL DEFAULT false, "requiresCrane" boolean NOT NULL DEFAULT false, "requiresLoadingDock" boolean NOT NULL DEFAULT false, "loadingTimeEstimate" numeric(5,2), "unloadingTimeEstimate" numeric(5,2), "hazmatClass" character varying(50), "hazmatNumber" character varying(20), "urgencyLevel" "public"."loads_urgencylevel_enum" NOT NULL DEFAULT 'NORMAL', "isTimeCritical" boolean NOT NULL DEFAULT false, "maxTransitTime" numeric(5,2), "packagingType" character varying(50), "numberOfPieces" integer NOT NULL DEFAULT '0', "numberOfPallets" integer NOT NULL DEFAULT '0', "requiresGpsMonitoring" boolean NOT NULL DEFAULT false, "requiresTemperatureMonitoring" boolean NOT NULL DEFAULT false, "insuranceValue" numeric(15,2), "requiresLowClearanceRoute" boolean NOT NULL DEFAULT false, "maxClearanceHeight" numeric(5,2), "requiresEscortVehicle" boolean NOT NULL DEFAULT false, "specialHandlingInstructions" text, "loadingInstructions" text, "unloadingInstructions" text, "emergencyContactInfo" text, "truckRequirements" jsonb NOT NULL DEFAULT '{}', "carrierPreferences" jsonb NOT NULL DEFAULT '{}', "costPreferences" jsonb NOT NULL DEFAULT '{}', "requiresPreShipmentInspection" boolean NOT NULL DEFAULT false, "requiresDeliveryInspection" boolean NOT NULL DEFAULT false, "requiresPhotographicDocumentation" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_c90caf6ef671c1a292bc4b4bc1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65e9985bec386b555808013671" ON "loads" ("cargoType", "urgencyLevel") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75f214ed89e36b74f09240c48b" ON "loads" ("status", "pickupDate", "deliveryDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd0be03f18388566078c007fbc" ON "loads" ("tenantId", "status", "cargoOwnerId") `,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bids_status_enum') THEN
          CREATE TYPE "public"."bids_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "bids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "truckOwnerId" uuid NOT NULL, "bidAmount" numeric(15,2) NOT NULL, "bidCurrency" character varying(3) NOT NULL DEFAULT 'USD', "proposedPickupDate" TIMESTAMP WITH TIME ZONE, "proposedDeliveryDate" TIMESTAMP WITH TIME ZONE, "status" "public"."bids_status_enum" NOT NULL DEFAULT 'PENDING', "bidNotes" text, "bidDetails" jsonb NOT NULL DEFAULT '{}', "successProbability" numeric(5,2), "riskAssessment" jsonb NOT NULL DEFAULT '{}', "marketContext" jsonb NOT NULL DEFAULT '{}', "isAutoBid" boolean NOT NULL DEFAULT false, "isCounterOffer" boolean NOT NULL DEFAULT false, "parentBidId" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2957b65918a614a7cd1a731a0b" ON "bids" ("createdAt", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ded262130947dd85545795c198" ON "bids" ("loadId", "truckOwnerId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auction_watches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auctionId" uuid NOT NULL, "watcherId" uuid NOT NULL, "tenantId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "notificationPreferences" jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_fb5486c2c9378395a86bcbf9de5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a2acc295677ee7a71aef6159e" ON "auction_watches" ("tenantId", "isActive") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e7bddc41671772b45a3d803db9" ON "auction_watches" ("auctionId", "watcherId") `,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auctions_auctiontype_enum') THEN
          CREATE TYPE "public"."auctions_auctiontype_enum" AS ENUM('REVERSE', 'FORWARD', 'DUTCH', 'SEALED');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auctions_status_enum') THEN
          CREATE TYPE "public"."auctions_status_enum" AS ENUM('SCHEDULED', 'ACTIVE', 'CLOSED', 'CANCELLED', 'PAUSED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loadId" uuid NOT NULL, "auctionType" "public"."auctions_auctiontype_enum" NOT NULL DEFAULT 'REVERSE', "status" "public"."auctions_status_enum" NOT NULL DEFAULT 'SCHEDULED', "auctionStart" TIMESTAMP WITH TIME ZONE NOT NULL, "auctionEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "reservePrice" numeric(15,2), "minimumBidIncrement" numeric(15,2), "maximumBidAmount" numeric(15,2), "totalBids" integer NOT NULL DEFAULT '0', "uniqueBidders" integer NOT NULL DEFAULT '0', "currentHighestBid" numeric(15,2), "winningBidId" uuid, "winningBidderId" uuid, "awardedAt" TIMESTAMP WITH TIME ZONE, "auctionRules" jsonb NOT NULL DEFAULT '{}', "notificationSettings" jsonb NOT NULL DEFAULT '{}', "analytics" jsonb NOT NULL DEFAULT '{}', "cancellationReason" text, "cancelledBy" uuid, "cancelledAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "REL_0e1f240cbe7467e649e0a22f97" UNIQUE ("loadId"), CONSTRAINT "REL_f56f0d097f1fb02c07d6bdc368" UNIQUE ("winningBidId"), CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a89dfd6db31fa96d6a8e64a7d" ON "auctions" ("auctionStart", "auctionEnd") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ca0bbd33276430d15fc09b033" ON "auctions" ("loadId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auction_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auctionId" uuid NOT NULL, "viewerId" uuid NOT NULL, "tenantId" uuid NOT NULL, "viewedAt" TIMESTAMP NOT NULL DEFAULT now(), "ipAddress" character varying(45), "userAgent" text, "referrer" text, "sessionId" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_11cf1335814dc1c0628d5ab7325" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4717345788dc42ffa2d2848f78" ON "auction_views" ("tenantId", "viewedAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a81d93c5706529dad43990e4a3" ON "auction_views" ("auctionId", "viewerId") `,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 'TRUCK_OWNER', 'DRIVER', 'AGENT', 'LENDER');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN
          CREATE TYPE "public"."users_status_enum" AS ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "email" character varying NOT NULL, "phone" character varying, "passwordHash" character varying NOT NULL, "emailVerifiedAt" TIMESTAMP, "phoneVerifiedAt" TIMESTAMP, "twoFactorEnabled" boolean NOT NULL DEFAULT false, "twoFactorSecret" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CARGO_OWNER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION', "lastLoginAt" TIMESTAMP, "loginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6ee2d4bf901675877bb94977c" ON "users" ("role", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_019a1bfe83abbfab615a3c3ef9" ON "users" ("tenantId", "email") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kycstatus_enum') THEN
          CREATE TYPE "public"."user_profiles_kycstatus_enum" AS ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tenantId" uuid NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "companyName" character varying, "taxId" character varying, "businessLicense" character varying, "address" character varying, "cityId" integer, "postalCode" character varying, "countryCode" character varying, "avatarUrl" character varying, "deleted_at" TIMESTAMP, "bio" character varying, "websiteUrl" character varying, "insuranceInfo" jsonb NOT NULL DEFAULT '{}', "bankAccountInfo" jsonb NOT NULL DEFAULT '{}', "preferences" jsonb NOT NULL DEFAULT '{}', "kycStatus" "public"."user_profiles_kycstatus_enum" NOT NULL DEFAULT 'PENDING', "kycDocuments" text NOT NULL DEFAULT '[]', "kycVerifiedAt" TIMESTAMP, "rating" numeric(3,2) NOT NULL DEFAULT '0', "totalTrips" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97954c0b0366e6ab20a70253d7" ON "user_profiles" ("rating", "totalTrips") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d290ec25283e89af64958e21b0" ON "user_profiles" ("tenantId", "kycStatus") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8481388d6325e752cd4d7e26c6" ON "user_profiles" ("userId") `,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trucks_fueltype_enum') THEN
          CREATE TYPE "public"."trucks_fueltype_enum" AS ENUM('DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID', 'CNG', 'LNG');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trucks_trucktype_enum') THEN
          CREATE TYPE "public"."trucks_trucktype_enum" AS ENUM('FLATBED', 'BOX_TRUCK', 'TANKER', 'REFRIGERATED', 'CONTAINER', 'CAR_CARRIER', 'HEAVY_HAUL', 'LOWBED', 'STEP_DECK', 'POWER_ONLY', 'CURTAIN_SIDE', 'VAN', 'PLATFORM', 'BULK', 'DUMP', 'CEMENT_MIXER', 'CRANE', 'FIRE_TRUCK', 'AMBULANCE', 'TOW_TRUCK', 'GARBAGE', 'MILITARY', 'SPECIALIZED');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trucks_trailertype_enum') THEN
          CREATE TYPE "public"."trucks_trailertype_enum" AS ENUM('FLATBED', 'DRY_VAN', 'REFRIGERATED', 'TANKER', 'BULK', 'CONTAINER', 'CAR_CARRIER', 'HEAVY_HAUL', 'LOWBED', 'STEP_DECK', 'POWER_ONLY', 'CURTAIN_SIDE', 'PLATFORM', 'DUMP', 'CEMENT_MIXER', 'CRANE', 'SPECIALIZED');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trucks_status_enum') THEN
          CREATE TYPE "public"."trucks_status_enum" AS ENUM('AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "trucks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "ownerId" uuid NOT NULL, "plateNumber" character varying(20) NOT NULL, "vin" character varying(17) NOT NULL, "make" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "year" integer NOT NULL, "color" character varying(50), "fuelType" "public"."trucks_fueltype_enum" NOT NULL DEFAULT 'DIESEL', "capacityWeight" numeric(10,2) NOT NULL, "capacityVolume" numeric(10,2) NOT NULL, "maxLength" numeric(8,2), "maxWidth" numeric(8,2), "maxHeight" numeric(8,2), "truckType" "public"."trucks_trucktype_enum" NOT NULL DEFAULT 'FLATBED', "trailerType" "public"."trucks_trailertype_enum", "hasSideRails" boolean NOT NULL DEFAULT false, "hasTarps" boolean NOT NULL DEFAULT false, "hasStraps" boolean NOT NULL DEFAULT false, "hasChains" boolean NOT NULL DEFAULT false, "hasWinch" boolean NOT NULL DEFAULT false, "hasRam" boolean NOT NULL DEFAULT false, "hasTailLift" boolean NOT NULL DEFAULT false, "hasSideLift" boolean NOT NULL DEFAULT false, "hasRollerBed" boolean NOT NULL DEFAULT false, "hasDropDeck" boolean NOT NULL DEFAULT false, "hasExtendable" boolean NOT NULL DEFAULT false, "hasLowbed" boolean NOT NULL DEFAULT false, "hasStepDeck" boolean NOT NULL DEFAULT false, "hasPowerOnly" boolean NOT NULL DEFAULT false, "hasContainerChassis" boolean NOT NULL DEFAULT false, "hasTanker" boolean NOT NULL DEFAULT false, "hasBulk" boolean NOT NULL DEFAULT false, "hasRefrigerated" boolean NOT NULL DEFAULT false, "hasHeated" boolean NOT NULL DEFAULT false, "hasVentilated" boolean NOT NULL DEFAULT false, "hasCurtainSide" boolean NOT NULL DEFAULT false, "hasBox" boolean NOT NULL DEFAULT false, "hasVan" boolean NOT NULL DEFAULT false, "hasPlatform" boolean NOT NULL DEFAULT false, "hasCarCarrier" boolean NOT NULL DEFAULT false, "hasHeavyHaul" boolean NOT NULL DEFAULT false, "hasOversized" boolean NOT NULL DEFAULT false, "hasHazmat" boolean NOT NULL DEFAULT false, "hasDangerousGoods" boolean NOT NULL DEFAULT false, "hasFoodGrade" boolean NOT NULL DEFAULT false, "hasPharmaceutical" boolean NOT NULL DEFAULT false, "hasLiquid" boolean NOT NULL DEFAULT false, "hasDryBulk" boolean NOT NULL DEFAULT false, "hasGas" boolean NOT NULL DEFAULT false, "hasChemical" boolean NOT NULL DEFAULT false, "hasWaste" boolean NOT NULL DEFAULT false, "hasReefer" boolean NOT NULL DEFAULT false, "hasFrozen" boolean NOT NULL DEFAULT false, "hasChilled" boolean NOT NULL DEFAULT false, "hasAmbient" boolean NOT NULL DEFAULT false, "hasControlledAtmosphere" boolean NOT NULL DEFAULT false, "hasHumidityControl" boolean NOT NULL DEFAULT false, "hasTemperatureMonitoring" boolean NOT NULL DEFAULT false, "hasGPS" boolean NOT NULL DEFAULT false, "hasTracking" boolean NOT NULL DEFAULT false, "hasTelematics" boolean NOT NULL DEFAULT false, "hasELD" boolean NOT NULL DEFAULT false, "hasDashCam" boolean NOT NULL DEFAULT false, "hasSafetyCameras" boolean NOT NULL DEFAULT false, "hasCollisionAvoidance" boolean NOT NULL DEFAULT false, "hasLaneDeparture" boolean NOT NULL DEFAULT false, "hasAdaptiveCruise" boolean NOT NULL DEFAULT false, "hasBlindSpot" boolean NOT NULL DEFAULT false, "hasBackupCamera" boolean NOT NULL DEFAULT false, "hasTirePressureMonitoring" boolean NOT NULL DEFAULT false, "hasEngineMonitoring" boolean NOT NULL DEFAULT false, "hasFuelMonitoring" boolean NOT NULL DEFAULT false, "hasMaintenanceAlerts" boolean NOT NULL DEFAULT false, "hasDriverMonitoring" boolean NOT NULL DEFAULT false, "hasFatigueMonitoring" boolean NOT NULL DEFAULT false, "hasSpeedMonitoring" boolean NOT NULL DEFAULT false, "hasIdleMonitoring" boolean NOT NULL DEFAULT false, "hasRouteOptimization" boolean NOT NULL DEFAULT false, "hasRealTimeTracking" boolean NOT NULL DEFAULT false, "hasGeofencing" boolean NOT NULL DEFAULT false, "hasTemperatureAlerts" boolean NOT NULL DEFAULT false, "hasHumidityAlerts" boolean NOT NULL DEFAULT false, "hasShockMonitoring" boolean NOT NULL DEFAULT false, "hasTiltMonitoring" boolean NOT NULL DEFAULT false, "hasDoorMonitoring" boolean NOT NULL DEFAULT false, "hasCargoMonitoring" boolean NOT NULL DEFAULT false, "hasWeightMonitoring" boolean NOT NULL DEFAULT false, "hasVolumeMonitoring" boolean NOT NULL DEFAULT false, "hasPressureMonitoring" boolean NOT NULL DEFAULT false, "hasFlowMonitoring" boolean NOT NULL DEFAULT false, "hasLevelMonitoring" boolean NOT NULL DEFAULT false, "hasQualityMonitoring" boolean NOT NULL DEFAULT false, "hasContaminationMonitoring" boolean NOT NULL DEFAULT false, "hasLeakDetection" boolean NOT NULL DEFAULT false, "hasOverfillProtection" boolean NOT NULL DEFAULT false, "hasEmergencyShutdown" boolean NOT NULL DEFAULT false, "hasFireSuppression" boolean NOT NULL DEFAULT false, "hasExplosionProof" boolean NOT NULL DEFAULT false, "hasCorrosionResistant" boolean NOT NULL DEFAULT false, "hasStainlessSteel" boolean NOT NULL DEFAULT false, "hasAluminum" boolean NOT NULL DEFAULT false, "hasCarbonSteel" boolean NOT NULL DEFAULT false, "hasFiberglass" boolean NOT NULL DEFAULT false, "hasPlastic" boolean NOT NULL DEFAULT false, "hasComposite" boolean NOT NULL DEFAULT false, "hasInsulated" boolean NOT NULL DEFAULT false, "cargoCapabilities" jsonb NOT NULL DEFAULT '{}', "loadingCapabilities" jsonb NOT NULL DEFAULT '{}', "securityFeatures" jsonb NOT NULL DEFAULT '{}', "certifications" jsonb NOT NULL DEFAULT '{}', "routeCapabilities" jsonb NOT NULL DEFAULT '{}', "costStructure" jsonb NOT NULL DEFAULT '{}', "status" "public"."trucks_status_enum" NOT NULL DEFAULT 'AVAILABLE', "currentLocation" jsonb, "locationUpdatedAt" TIMESTAMP, "registrationNumber" character varying(50) NOT NULL, "registrationExpiry" date NOT NULL, "insurancePolicy" character varying(50) NOT NULL, "insuranceExpiry" date NOT NULL, "roadworthyCertExpiry" date, "hasRefrigeration" boolean NOT NULL DEFAULT false, "hasLiftGate" boolean NOT NULL DEFAULT false, "hasGps" boolean NOT NULL DEFAULT false, "hasHazmatPermit" boolean NOT NULL DEFAULT false, "equipmentList" jsonb NOT NULL DEFAULT '[]', "lastMaintenanceDate" date, "nextMaintenanceDate" date, "mileage" integer NOT NULL DEFAULT '0', "maintenanceAlerts" jsonb NOT NULL DEFAULT '[]', "assignedDrivers" jsonb NOT NULL DEFAULT '[]', "assignedRoutes" jsonb NOT NULL DEFAULT '[]', "totalTrips" integer NOT NULL DEFAULT '0', "totalRevenue" numeric(15,2) NOT NULL DEFAULT '0', "fuelEfficiency" numeric(8,2), "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "currentDriverId" uuid, "currentTripId" uuid, "estimatedAvailableTime" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_9f46d9e4e1c02f40880e9afbebc" UNIQUE ("vin"), CONSTRAINT "PK_6a134fb7caa4fb476d8a6e035f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48dcd4a878738f9e4b317f8284" ON "trucks" ("truckType", "capacityWeight") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_276395bf346318598852569a14" ON "trucks" ("status", "currentTripId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_626a05a3e3d6cc8b488e21bc89" ON "trucks" ("ownerId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0ab497cdb0d3e2da3b58f5f704" ON "trucks" ("tenantId", "plateNumber") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_scores_category_enum') THEN
          CREATE TYPE "public"."user_scores_category_enum" AS ENUM('financial_health', 'transaction_history', 'payment_behavior', 'cargo_quality', 'communication_score', 'reliability_score', 'overall_credit_score');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_scores_algorithm_enum') THEN
          CREATE TYPE "public"."user_scores_algorithm_enum" AS ENUM('financial_analysis', 'behavioral_pattern', 'risk_assessment', 'comprehensive');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "user_scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "category" "public"."user_scores_category_enum" NOT NULL, "score" numeric(5,2) NOT NULL, "normalizedScore" numeric(5,2) NOT NULL, "algorithm" "public"."user_scores_algorithm_enum" NOT NULL, "factors" jsonb NOT NULL, "metadata" jsonb, "explanation" text, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_caf56c8fd1af4eeddd1aee555ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "address" text NOT NULL, "cityId" integer, "postalCode" character varying, "city" character varying, "state" character varying, "country" character varying, "region" character varying, "district" character varying, "neighborhood" character varying, "landmark" character varying, "locationCategory" character varying, "locationSubCategory" character varying, "businessHours" character varying, "timezone" character varying, "accessType" character varying, "parkingAvailable" boolean, "securityLevel" character varying, "loadingDockCount" integer, "maxTruckHeight" integer, "maxTruckWeight" integer, "specialInstructions" character varying, "coordinates" jsonb, "locationType" character varying NOT NULL DEFAULT 'GENERAL', "contactInfo" jsonb NOT NULL DEFAULT '{}', "operatingHours" jsonb NOT NULL DEFAULT '{}', "facilities" jsonb NOT NULL DEFAULT '{}', "accessInstructions" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4213eecf7e05b183b5bdd81cd9" ON "locations" ("city", "state", "country") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b6520cb9bb8a02bf381f3457a" ON "locations" ("locationType", "locationCategory") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ed6671dd1550a7602653b4d69f" ON "locations" ("tenantId", "cityId", "isActive") `,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drivers_employmenttype_enum') THEN
          CREATE TYPE "public"."drivers_employmenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'OWNER_OPERATOR', 'FREELANCE');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drivers_status_enum') THEN
          CREATE TYPE "public"."drivers_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED', 'IN_TRANSIT');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "drivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "employerId" uuid NOT NULL, "employeeId" character varying, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "dateOfBirth" date NOT NULL, "address" text NOT NULL, "emergencyContact" jsonb NOT NULL DEFAULT '{}', "licenseNumber" character varying(50) NOT NULL, "licenseClasses" jsonb NOT NULL DEFAULT '[]', "licenseIssueDate" date NOT NULL, "licenseExpiry" date NOT NULL, "licenseState" character varying(50) NOT NULL, "licenseCountry" character varying(50) NOT NULL, "endorsements" jsonb NOT NULL DEFAULT '[]', "restrictions" jsonb NOT NULL DEFAULT '[]', "employmentType" "public"."drivers_employmenttype_enum" NOT NULL DEFAULT 'FULL_TIME', "hireDate" date NOT NULL, "terminationDate" date, "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'ACTIVE', "availabilityStatus" character varying NOT NULL DEFAULT 'AVAILABLE', "currentTruckId" uuid, "currentTripId" uuid, "currentLocation" jsonb, "locationUpdatedAt" TIMESTAMP, "hoursWorkedThisWeek" numeric(5,2) NOT NULL DEFAULT '0', "hoursWorkedThisMonth" numeric(5,2) NOT NULL DEFAULT '0', "lastBreakTime" TIMESTAMP, "consecutiveDrivingHours" integer NOT NULL DEFAULT '0', "medicalCertExpiry" date, "drugTestDate" date, "backgroundCheckDate" date, "trainingCompletionDate" date, "certifications" jsonb NOT NULL DEFAULT '[]', "rating" numeric(3,2) NOT NULL DEFAULT '0', "totalTrips" integer NOT NULL DEFAULT '0', "totalDistance" numeric(12,2) NOT NULL DEFAULT '0', "safetyScore" numeric(5,2) NOT NULL DEFAULT '100', "onTimeDeliveryRate" numeric(5,2) NOT NULL DEFAULT '0', "hourlyRate" numeric(10,2), "mileageRate" numeric(10,2), "totalEarnings" numeric(15,2) NOT NULL DEFAULT '0', "preferences" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_754b3d50a8cc64f7ad5c24f62b4" UNIQUE ("licenseNumber"), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e37260a9a24b4c6ce5d4b707f7" ON "drivers" ("status", "availabilityStatus", "currentTripId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1b4ab364736c5c944fa609ad6" ON "drivers" ("userId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a5560f622ffb715d76990a84d" ON "drivers" ("tenantId", "employerId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_baea09a6daa36c25bc1f321699" ON "drivers" ("licenseNumber") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trips_status_enum" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "loadId" uuid NOT NULL, "truckId" uuid NOT NULL, "driverId" uuid NOT NULL, "tripNumber" character varying(50) NOT NULL, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'PLANNED', "plannedStartTime" TIMESTAMP WITH TIME ZONE NOT NULL, "plannedEndTime" TIMESTAMP WITH TIME ZONE NOT NULL, "actualStartTime" TIMESTAMP WITH TIME ZONE, "estimatedEndTime" TIMESTAMP WITH TIME ZONE, "actualEndTime" TIMESTAMP WITH TIME ZONE, "plannedRoute" jsonb, "actualRoute" jsonb, "totalDistance" numeric(10,2), "agreedPrice" numeric(15,2) NOT NULL, "currencyCode" character varying(3) NOT NULL DEFAULT 'USD', "fuelCost" numeric(10,2), "tollsCost" numeric(10,2), "otherExpenses" numeric(10,2), "totalCost" numeric(15,2), "profitMargin" numeric(5,2), "fuelEfficiency" numeric(8,2), "averageSpeed" numeric(8,2), "onTimePerformance" boolean, "eta" TIMESTAMP WITH TIME ZONE, "distance" double precision, "duration" double precision, "currentLocation" jsonb, "locationUpdatedAt" TIMESTAMP, "estimatedArrival" TIMESTAMP WITH TIME ZONE, "cargoOwnerRating" numeric(3,2), "cargoOwnerFeedback" character varying, "driverRating" numeric(3,2), "driverFeedback" character varying, "notes" character varying, "issuesReported" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, "deleted_at" TIMESTAMP, "pickupLocationId" uuid, "deliveryLocationId" uuid, CONSTRAINT "UQ_47c934ba14c7f8893184544f865" UNIQUE ("tripNumber"), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_362e8d81afdb8382910522e816" ON "trips" ("truckId", "driverId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2a6c890a6286c8f2d08cac093" ON "trips" ("loadId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b39eed9ee569cf9c1607a1617" ON "trips" ("tenantId", "status", "plannedStartTime") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_47c934ba14c7f8893184544f86" ON "trips" ("tripNumber") `,
    );
    await queryRunner.query(
      `CREATE TABLE "route_trucks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "routeId" uuid NOT NULL, "truckId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_468d75203232a52d433c4eb12b0" UNIQUE ("tenantId", "routeId", "truckId"), CONSTRAINT "PK_eb8d8d94a28bcfe6d970802e578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1295fe8acbf4dd97725a724515" ON "route_trucks" ("tenantId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."routes_routetype_enum" AS ENUM('highway', 'city', 'rural', 'mixed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."routes_status_enum" AS ENUM('active', 'inactive', 'maintenance')`,
    );
    await queryRunner.query(
      `CREATE TABLE "routes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, "origin" character varying(100) NOT NULL, "destination" character varying(100) NOT NULL, "distance" numeric(10,2) NOT NULL, "estimatedTime" integer NOT NULL, "routeType" "public"."routes_routetype_enum" NOT NULL DEFAULT 'highway', "status" "public"."routes_status_enum" NOT NULL DEFAULT 'active', "assignedTrucks" jsonb NOT NULL DEFAULT '[]', "assignedDrivers" jsonb NOT NULL DEFAULT '[]', "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6adb772851f4af60aa2f6107f3" ON "routes" ("routeType", "distance") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cca52097756a60c06f44ba32b5" ON "routes" ("tenantId", "status", "isActive") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6d53c760355b9723023759f004" ON "routes" ("tenantId", "name") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "revokedAt" TIMESTAMP, "revokedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39826ab358c6120ef1c94c9728" ON "refresh_tokens" ("userId", "revoked", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash', 'check', 'wire_transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('trip_payment', 'subscription', 'service_fee', 'deposit', 'refund', 'withdrawal', 'advance', 'final')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'escrow')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotencyKey" character varying, "tenantId" uuid NOT NULL, "tripId" uuid NOT NULL, "payerId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "paymentType" "public"."payments_paymenttype_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "description" character varying, "referenceNumber" character varying, "transactionId" character varying, "gatewayResponse" character varying, "failureReason" character varying, "billingAddress" character varying, "notes" character varying, "dueDate" TIMESTAMP, "processedAt" TIMESTAMP, "processingFee" numeric(10,2), "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4fb62d2d4b021d56ef49442c2" ON "payments" ("createdAt", "processedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23ce7ad7cd769295adf0fb7dd1" ON "payments" ("paymentMethod", "paymentType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ca6e3b1d21d6e54b32ea8d88b" ON "payments" ("tenantId", "tripId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e5c81b11c851f8cbe2fd357d1" ON "password_reset_tokens" ("email", "used", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('trip_update', 'payment_received', 'payment_failed', 'load_assigned', 'load_completed', 'driver_assigned', 'truck_maintenance', 'system_alert', 'matching_result', 'location_update', 'payment_refund', 'trip_cancelled', 'driver_available', 'truck_available')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_category_enum" AS ENUM('trip_status', 'payment', 'system', 'general', 'safety', 'performance', 'maintenance', 'security', 'marketing')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_deliverystatus_enum" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "maxRetries" integer, "externalId" character varying, "tenantId" uuid NOT NULL, "recipientId" uuid NOT NULL, "senderId" uuid, "type" "public"."notifications_type_enum" NOT NULL, "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'normal', "title" character varying NOT NULL, "message" text NOT NULL, "relatedEntityId" character varying, "relatedEntityType" character varying, "channels" text, "metadata" jsonb NOT NULL DEFAULT '{}', "actionUrl" character varying, "actionText" character varying, "imageUrl" character varying, "category" "public"."notifications_category_enum", "isRead" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "archivedAt" TIMESTAMP, "deliveryStatus" "public"."notifications_deliverystatus_enum" NOT NULL DEFAULT 'pending', "recipientEmail" character varying, "templateId" character varying, "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "failureReason" character varying, "retryCount" integer NOT NULL DEFAULT '0', "scheduledAt" TIMESTAMP, "subject" character varying, "content" text, "templateData" jsonb, "recipientPhone" character varying, "deviceToken" character varying, "trackingId" character varying, "openedAt" TIMESTAMP, "clickedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3e90d958270f67459f0663d52" ON "notifications" ("deliveryStatus", "scheduledAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca2808ef437730b9653f4b321f" ON "notifications" ("type", "priority", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_126be15a96309fba7823e75f57" ON "notifications" ("tenantId", "recipientId", "isRead") `,
    );
    await queryRunner.query(
      `CREATE TABLE "load_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "templateData" jsonb NOT NULL, "createdBy" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "usageCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_89833bd8dda8e54f607e020c48f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_389dee553f4b96fc73104f7f91" ON "load_templates" ("usageCount", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2e3d057c72aad00dde4e01692" ON "load_templates" ("tenantId", "createdBy", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3d1613f95c6a564a3b588d161ae" UNIQUE ("token"), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b57ebc59c9cecb4042bba9ebc5" ON "email_verification_tokens" ("email", "used", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3d1613f95c6a564a3b588d161a" ON "email_verification_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."disputes_status_enum" AS ENUM('OPEN', 'RESOLVED', 'ESCALATED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "disputes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "tripId" uuid NOT NULL, "raisedById" uuid NOT NULL, "status" "public"."disputes_status_enum" NOT NULL DEFAULT 'OPEN', "reason" text NOT NULL, "resolution" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3c97580d01c1a4b0b345c42a107" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87f74e36204b6338c798f5ba8e" ON "disputes" ("tripId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_395720394b2b78fafdb879bd6b" ON "disputes" ("tenantId", "status", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'DISPUTE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL DEFAULT 'OTHER', "description" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99e589da8f9e9326ee0d01a028" ON "audit_logs" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6487ed4412ddfdc52ca261fb7" ON "audit_logs" ("tenantId", "action", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loan_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'disbursed', 'repaid', 'failed', 'defaulted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loan_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cargo_id" uuid NOT NULL, "trip_id" uuid NOT NULL, "lender_id" uuid, "requested_amount" numeric(15,2) NOT NULL, "approved_amount" numeric(15,2), "status" "public"."loan_requests_status_enum" NOT NULL DEFAULT 'pending', "idempotency_key" character varying(255) NOT NULL, "interest_amount" numeric(15,2), "due_date" date, "created_by" uuid NOT NULL, "external_loan_ref" character varying(255), "rejection_reason" text, "requested_split" json, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5f2d8564e7eb4d695c072376958" UNIQUE ("idempotency_key"), CONSTRAINT "PK_52d5943f8adea74332d5d53ec6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5f2d8564e7eb4d695c07237695" ON "loan_requests" ("idempotency_key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ee7b30ea492666d64145dea44" ON "loan_requests" ("lender_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c7f21866f910eb39330b9ae245" ON "loan_requests" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "loan_repayments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loan_request_id" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "interest_paid" numeric(15,2) NOT NULL, "principal_paid" numeric(15,2) NOT NULL, "repayment_date" TIMESTAMP NOT NULL, "external_txn_ref" character varying(255), "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a37968e2dcfb72f910f5480cc16" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_995a06a8d5a68474ca56cc6921" ON "loan_repayments" ("loan_request_id", "repayment_date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loan_disbursements_status_enum" AS ENUM('initiated', 'success', 'failed', 'pending', 'approved', 'disbursed', 'rejected', 'on_hold')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loan_disbursements_priority_enum" AS ENUM('urgent', 'high', 'medium', 'low')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loan_disbursements_disbursement_method_enum" AS ENUM('bank_transfer', 'check', 'escrow', 'digital_wallet')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loan_disbursements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loan_request_id" uuid NOT NULL, "disbursement_date" TIMESTAMP, "beneficiaries" json NOT NULL, "status" "public"."loan_disbursements_status_enum" NOT NULL DEFAULT 'initiated', "external_txn_ref" character varying(255), "attempts" integer NOT NULL DEFAULT '0', "failure_reason" text, "next_retry_at" TIMESTAMP, "amount" numeric(15,2), "priority" "public"."loan_disbursements_priority_enum" NOT NULL DEFAULT 'medium', "documents" jsonb, "risk_score" numeric(3,1), "credit_score" integer, "collateral_value" numeric(15,2), "disbursement_method" "public"."loan_disbursements_disbursement_method_enum" NOT NULL DEFAULT 'bank_transfer', "notes" text, "purpose" character varying(500), "interest_rate" numeric(5,2), "term_months" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9165b079d61baa9724c985f6723" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ecdbc56578c2f5de4fd7d24644" ON "loan_disbursements" ("disbursement_date", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_080a9cf92edbaecc889252fe4f" ON "loan_disbursements" ("loan_request_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lenders_status_enum" AS ENUM('active', 'paused', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lenders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "api_key_hash" character varying(500) NOT NULL, "callback_url" character varying(500), "contact_email" character varying(255) NOT NULL, "status" "public"."lenders_status_enum" NOT NULL DEFAULT 'active', "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dec2ebd30bfaed645ddcb20229f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dfdd03a38c678c1cd413a51611" ON "lenders" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lender_permissions_category_enum" AS ENUM('loans', 'borrowers', 'analytics', 'settings', 'compliance', 'financial')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lender_permissions_level_enum" AS ENUM('read', 'write', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "category" "public"."lender_permissions_category_enum" NOT NULL, "level" "public"."lender_permissions_level_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_131b00b78e946b5f87d385cadb3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7e3658732378980e80c10b3aa" ON "lender_permissions" ("category", "level") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "level" integer NOT NULL DEFAULT '1', "is_custom" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4cf15e96ddeef469b699677803" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b44909fa1fe38acfc3cf35b3dd" ON "lender_roles" ("level", "is_custom") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lender_users_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "password_hash" character varying(255) NOT NULL, "lender_id" uuid NOT NULL, "role_id" uuid NOT NULL, "status" "public"."lender_users_status_enum" NOT NULL DEFAULT 'pending', "department" character varying(100), "avatar" character varying(500), "created_by" character varying(255) NOT NULL, "last_login" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3d8ef2c048340ec8452f926463" UNIQUE ("email"), CONSTRAINT "PK_0f9a636a7e5548d25866703dfb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a3d8ef2c048340ec8452f92646" ON "lender_users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73ef64a4e0a6f298e63ad8e804" ON "lender_users" ("lender_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "interest_rate" numeric(5,4) NOT NULL, "repayment_term_days" integer NOT NULL, "max_advance_per_trip" numeric(15,2) NOT NULL, "max_exposure" numeric(15,2) NOT NULL, "advance_percentage" numeric(5,4) NOT NULL DEFAULT '0.7', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_832872e4152c496a12d35ca547f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f684fad7dfb0f0baffd6ea99b3" ON "lender_policies" ("lender_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trip_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" character varying NOT NULL, "driverId" character varying NOT NULL, "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "altitude" numeric(5,2), "speed" numeric(5,2), "heading" numeric(5,2), "accuracy" numeric(5,2), "batteryLevel" numeric(5,2), "isMoving" boolean NOT NULL DEFAULT false, "metadata" jsonb, "timestamp" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f053370498ff61658917241d211" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_66a4fdd8f06d536dc5ef659e8f" ON "trip_locations" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_74f23daf6f2604f0adabfcac58" ON "trip_locations" ("driverId", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78ec5cd2f445dee8ae15338ba5" ON "trip_locations" ("tripId", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trip_events_type_enum" AS ENUM('TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'PICKUP_ARRIVED', 'PICKUP_COMPLETED', 'DELIVERY_ARRIVED', 'DELIVERY_COMPLETED', 'ROUTE_DEVIATION', 'ETA_UPDATED', 'WEATHER_UPDATE', 'TRAFFIC_UPDATE', 'FUEL_STOP', 'REST_STOP', 'MAINTENANCE_STOP', 'CUSTOMER_CONTACT', 'DOCUMENT_UPLOADED', 'SIGNATURE_COLLECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trip_events_severity_enum" AS ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "trip_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" character varying NOT NULL, "driverId" character varying NOT NULL, "type" "public"."trip_events_type_enum" NOT NULL, "severity" "public"."trip_events_severity_enum" NOT NULL DEFAULT 'INFO', "title" character varying NOT NULL, "description" text NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "speed" numeric(5,2), "data" jsonb, "requiresAcknowledgment" boolean NOT NULL DEFAULT false, "acknowledgedAt" TIMESTAMP, "acknowledgedBy" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df6ea3b2ad6f86f525d796220da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd901edc39205134d03cb76535" ON "trip_events" ("type", "severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3589adc3f99b4733fba9b3b311" ON "trip_events" ("driverId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3267692da4aac579792dabc4a2" ON "trip_events" ("tripId", "type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."geofences_type_enum" AS ENUM('PICKUP', 'DELIVERY', 'RESTRICTED', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "geofences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "type" "public"."geofences_type_enum" NOT NULL DEFAULT 'CUSTOM', "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "radius" numeric(8,2) NOT NULL, "polygon" jsonb, "isActive" boolean NOT NULL DEFAULT true, "settings" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c858c4e20c26a6e5b2a1a10c82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41f05d0ab196734c957a5f94c5" ON "geofences" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bb1f8300c1aa9af9f2773237c" ON "geofences" ("type", "isActive") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."driver_alerts_type_enum" AS ENUM('SPEEDING', 'HARD_BRAKING', 'HARD_ACCELERATION', 'SHARP_TURN', 'IDLE_TIME', 'OFF_ROUTE', 'EMERGENCY', 'BATTERY_LOW', 'GEOFENCE_VIOLATION', 'WEATHER_ALERT', 'MAINTENANCE_ALERT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."driver_alerts_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."driver_alerts_status_enum" AS ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "driver_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverId" character varying NOT NULL, "tripId" character varying, "type" "public"."driver_alerts_type_enum" NOT NULL, "severity" "public"."driver_alerts_severity_enum" NOT NULL DEFAULT 'MEDIUM', "status" "public"."driver_alerts_status_enum" NOT NULL DEFAULT 'ACTIVE', "title" character varying NOT NULL, "message" text NOT NULL, "latitude" numeric(10,8), "longitude" numeric(11,8), "speed" numeric(5,2), "data" jsonb, "acknowledgedAt" TIMESTAMP, "acknowledgedBy" character varying, "resolvedAt" TIMESTAMP, "resolvedBy" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28b35bf619e38d94c3f53c495c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fb62928ec18d06acd906abe59" ON "driver_alerts" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_876df290ec8bb81ffa45901b5a" ON "driver_alerts" ("type", "severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f0b90cfcb9a320d316c792f60" ON "driver_alerts" ("tripId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d1bc20ea70fb8d1fb8ea6eb51" ON "driver_alerts" ("driverId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_models_modeltype_enum" AS ENUM('linear_regression', 'random_forest', 'gradient_boosting', 'neural_network', 'ensemble', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_models_version_enum" AS ENUM('v1.0', 'v1.1', 'v2.0', 'v2.1', 'beta')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_models_status_enum" AS ENUM('training', 'active', 'inactive', 'deprecated', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pricing_models" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, "modelType" "public"."pricing_models_modeltype_enum" NOT NULL DEFAULT 'gradient_boosting', "version" "public"."pricing_models_version_enum" NOT NULL DEFAULT 'v1.0', "status" "public"."pricing_models_status_enum" NOT NULL DEFAULT 'inactive', "modelPath" character varying(255), "hyperparameters" jsonb, "featureConfig" jsonb, "performanceMetrics" jsonb, "trainingMetrics" jsonb, "biasMetrics" jsonb, "explainabilityMetrics" jsonb, "aBTestConfig" jsonb, "monitoringConfig" jsonb, "lastTrainingDate" TIMESTAMP, "lastInferenceDate" TIMESTAMP, "nextRetrainingDate" TIMESTAMP, "totalInferences" integer NOT NULL DEFAULT '0', "averageInferenceTime" numeric(10,2) NOT NULL DEFAULT '0', "averagePredictionAccuracy" numeric(10,2) NOT NULL DEFAULT '0', "metadata" jsonb, "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d5c719fee2b6e2f857a67fc6b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5a95c2eb289dbb91ed5399bb9" ON "pricing_models" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28a3a367424398db63e6cc68a5" ON "pricing_models" ("version", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d884262384edc276df2b0ef4b" ON "pricing_models" ("tenantId", "modelType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17fe5d255209b618bc0f8c768d" ON "pricing_models" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_predictions_status_enum" AS ENUM('pending', 'processed', 'failed', 'validated', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pricing_predictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "modelId" uuid NOT NULL, "tripId" uuid, "loadId" uuid, "truckId" uuid, "driverId" uuid, "status" "public"."pricing_predictions_status_enum" NOT NULL DEFAULT 'pending', "distance" numeric(10,2) NOT NULL, "weight" numeric(10,2) NOT NULL, "volume" numeric(10,2) NOT NULL, "originLocation" character varying(255) NOT NULL, "destinationLocation" character varying(255) NOT NULL, "routeComplexity" jsonb NOT NULL, "marketConditions" jsonb NOT NULL, "truckAvailability" jsonb NOT NULL, "driverMetrics" jsonb NOT NULL, "environmentalFactors" jsonb NOT NULL, "temporalFeatures" jsonb NOT NULL, "cargoFeatures" jsonb NOT NULL, "predictedPrice" numeric(12,2) NOT NULL, "actualPrice" numeric(12,2), "predictionAccuracy" numeric(10,2), "predictionError" numeric(10,2), "confidenceInterval" numeric(12,2) NOT NULL, "featureContributions" jsonb NOT NULL, "shapValues" jsonb NOT NULL, "limeExplanation" jsonb NOT NULL, "inferenceTime" numeric(10,4) NOT NULL, "modelVersion" jsonb NOT NULL, "isAccepted" boolean NOT NULL DEFAULT false, "isRejected" boolean NOT NULL DEFAULT false, "rejectionReason" character varying(255), "acceptedPrice" numeric(12,2), "acceptedAt" TIMESTAMP, "acceptedBy" character varying(255), "abTestGroup" character varying(50), "isABTest" boolean NOT NULL DEFAULT false, "biasMetrics" jsonb, "isAnomaly" boolean NOT NULL DEFAULT false, "anomalyScore" numeric(10,4), "driftMetrics" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "predictedAt" TIMESTAMP, "validatedAt" TIMESTAMP, CONSTRAINT "PK_08c32e60bd43778416f424e5701" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d10083cddf802f824f537e86" ON "pricing_predictions" ("predictedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_812cb7cef1a3b868ec9aeb532a" ON "pricing_predictions" ("tripId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f87cff4fc4d3a190d5ad231b4a" ON "pricing_predictions" ("modelId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bfb0f932879521ce30397dd1be" ON "pricing_predictions" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7bf38a558895c578d35ea19a94" ON "pricing_predictions" ("tenantId", "modelId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_features_featuretype_enum" AS ENUM('numerical', 'categorical', 'temporal', 'geospatial', 'text', 'boolean', 'composite')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_features_featuresource_enum" AS ENUM('trip_data', 'market_data', 'weather_data', 'traffic_data', 'fuel_data', 'driver_data', 'truck_data', 'external_api', 'computed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pricing_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "featureName" character varying(255) NOT NULL, "description" character varying(500) NOT NULL, "featureType" "public"."pricing_features_featuretype_enum" NOT NULL DEFAULT 'numerical', "featureSource" "public"."pricing_features_featuresource_enum" NOT NULL DEFAULT 'computed', "dataType" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isRequired" boolean NOT NULL DEFAULT false, "importance" integer NOT NULL DEFAULT '0', "correlationWithTarget" numeric(10,4), "statistics" jsonb, "preprocessing" jsonb, "validation" jsonb, "driftMetrics" jsonb, "biasMetrics" jsonb, "featureEngineering" jsonb, "qualityMetrics" jsonb, "metadata" jsonb, "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a2bc88284be8bf2a98145aacbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be0cae5943aeb3a2aaa4344ef1" ON "pricing_features" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f39e8d6b34aaaf11c37d3f64bf" ON "pricing_features" ("featureName", "tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_677b7a8c0a08cfa3c23c699d76" ON "pricing_features" ("tenantId", "featureSource") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8eedc2f59890953881e6176186" ON "pricing_features" ("tenantId", "featureType") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_templates_type_enum" AS ENUM('email', 'sms', 'push', 'in_app')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_templates_category_enum" AS ENUM('trip_status', 'payment', 'safety', 'performance', 'maintenance', 'system', 'marketing')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "type" "public"."notification_templates_type_enum" NOT NULL DEFAULT 'email', "category" "public"."notification_templates_category_enum" NOT NULL DEFAULT 'system', "language" character varying(10) NOT NULL DEFAULT 'en', "subject" character varying(255), "content" text NOT NULL, "htmlContent" text, "plainTextContent" text, "variables" jsonb, "defaultValues" jsonb, "branding" jsonb, "metadata" jsonb, "isActive" boolean NOT NULL DEFAULT true, "isDefault" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '0', "createdBy" character varying(255), "updatedBy" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ec35888951e02b2898f54fd26" ON "notification_templates" ("isActive", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e48756cbf41b42cb414abe1966" ON "notification_templates" ("tenantId", "language") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2191a1db3a22d1d2a8e055601d" ON "notification_templates" ("tenantId", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a1b8057b12c7bf4e7e61856662" ON "notification_templates" ("tenantId", "category") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_preferences_category_enum" AS ENUM('trip_status', 'payment', 'safety', 'performance', 'maintenance', 'system', 'marketing')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_preferences_channel_enum" AS ENUM('email', 'sms', 'push', 'in_app')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "category" "public"."notification_preferences_category_enum" NOT NULL DEFAULT 'system', "channel" "public"."notification_preferences_channel_enum" NOT NULL DEFAULT 'email', "isEnabled" boolean NOT NULL DEFAULT true, "emailEnabled" boolean NOT NULL DEFAULT true, "smsEnabled" boolean NOT NULL DEFAULT true, "pushEnabled" boolean NOT NULL DEFAULT true, "inAppEnabled" boolean NOT NULL DEFAULT true, "emailAddress" character varying(255), "phoneNumber" character varying(20), "deviceToken" character varying(255), "language" character varying(10) NOT NULL DEFAULT 'en', "timezone" character varying(10) NOT NULL DEFAULT 'UTC', "quietHours" jsonb, "frequency" jsonb, "priority" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8facef03fbe2ee514e7fe7fe14" ON "notification_preferences" ("userId", "channel") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90d452c90494da1080c16b52c1" ON "notification_preferences" ("userId", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2e2691f8172b07d81e0d1e347" ON "notification_preferences" ("tenantId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tax_records_type_enum" AS ENUM('ifta', 'fuel_tax', 'income_tax', 'sales_tax')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tax_records_status_enum" AS ENUM('pending', 'filed', 'paid', 'overdue')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tax_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."tax_records_type_enum" NOT NULL, "period" character varying NOT NULL, "filingDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."tax_records_status_enum" NOT NULL DEFAULT 'pending', "jurisdiction" character varying NOT NULL, "referenceNumber" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_db43e50fbb0fd5cc693e5f61eee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "customerId" character varying NOT NULL, "customerName" character varying NOT NULL, "tripId" character varying, "truckId" character varying, "driverId" character varying, "issueDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft', "subtotal" numeric(10,2) NOT NULL, "taxAmount" numeric(10,2) NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "notes" text, "paymentTerms" character varying NOT NULL DEFAULT 'Net 30', "paymentMethod" character varying, "paidDate" TIMESTAMP, "lateFees" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoice_items_type_enum" AS ENUM('freight', 'fuel_surcharge', 'toll', 'detention', 'lumper', 'accessorial')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "type" "public"."invoice_items_type_enum" NOT NULL, "tripId" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "invoiceId" uuid, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "year" integer NOT NULL, "month" integer, "category" character varying NOT NULL, "plannedAmount" numeric(10,2) NOT NULL, "actualAmount" numeric(10,2) NOT NULL, "variance" numeric(10,2) NOT NULL, "variancePercentage" numeric(5,2) NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."financial_reports_type_enum" AS ENUM('pl_statement', 'cash_flow', 'revenue', 'expense', 'profitability')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."financial_reports_period_enum" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "financial_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."financial_reports_type_enum" NOT NULL, "period" "public"."financial_reports_period_enum" NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "data" json NOT NULL, "generatedAt" TIMESTAMP NOT NULL, "generatedBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_4dd23f1aa1f11c233bad2937702" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_type_enum" AS ENUM('fuel', 'maintenance', 'toll', 'driver', 'insurance', 'tax', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_status_enum" AS ENUM('pending', 'approved', 'rejected', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."expenses_type_enum" NOT NULL, "category" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "date" TIMESTAMP NOT NULL, "description" character varying NOT NULL, "truckId" character varying, "driverId" character varying, "tripId" character varying, "receipt" character varying, "status" "public"."expenses_status_enum" NOT NULL DEFAULT 'pending', "approvedBy" character varying, "approvedDate" TIMESTAMP, "notes" text, "taxDeductible" boolean NOT NULL DEFAULT true, "allocationCustomerId" character varying, "allocationTripId" character varying, "allocationPercentage" numeric(5,2) NOT NULL DEFAULT '100', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_ff6d1f74bc7c2c32132bf363176" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05f0a14b055bab4011e9b58f09" ON "lender_role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4803284da86c04ffbab09e0a1" ON "lender_role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lender_user_permissions" ("user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_efe23dd2442a22b29b8c439121f" PRIMARY KEY ("user_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05f55bf74e2b5ba8b79b6f3b1c" ON "lender_user_permissions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e247569401d14be97b1d99928" ON "lender_user_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "idempotencyKey"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tripId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payerId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentType"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "transactionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "gatewayResponse"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "failureReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "billingAddress"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "dueDate"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "processedAt"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "idempotencyKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "tripId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "payerId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "currency" character varying(3) NOT NULL`,
    );
    // await queryRunner.query(`CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('trip_payment', 'subscription', 'service_fee', 'deposit', 'refund', 'withdrawal', 'advance', 'final')`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "paymentType" "public"."payments_paymenttype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "transactionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "gatewayResponse" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "failureReason" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "billingAddress" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "payments" ADD "dueDate" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "processedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "metadata" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "invoiceId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "invoiceNumber" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "customerId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "customerName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "paymentDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "createdBy" uuid NOT NULL`,
    );
    // await queryRunner.query(`DROP INDEX "public"."IDX_23ce7ad7cd769295adf0fb7dd1"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_0ca6e3b1d21d6e54b32ea8d88b"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payments_paymentmethod_enum" RENAME TO "payments_paymentmethod_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('check', 'ach', 'credit_card', 'wire', 'cash')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "public"."payments_paymentmethod_enum" USING "paymentMethod"::"text"::"public"."payments_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_paymentmethod_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payments_status_enum" RENAME TO "payments_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'completed', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum" USING "status"::"text"::"public"."payments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum_old"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "payments" ADD "notes" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_23ce7ad7cd769295adf0fb7dd1" ON "payments" ("paymentMethod", "paymentType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ca6e3b1d21d6e54b32ea8d88b" ON "payments" ("tenantId", "tripId", "status") `,
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
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "route_trucks" ADD CONSTRAINT "FK_09edcc3902bee3dcf05426e3d2d" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_4277aa2c0e3a4a3591474dbea2f" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_ddb7981cf939fe620179bfea33a" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "load_templates" ADD CONSTRAINT "FK_bc954d3f801a7247cf678b4a9f5" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "loan_requests" ADD CONSTRAINT "FK_e9e0a90731bc470fedbbc86ecea" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "pricing_models" ADD CONSTRAINT "FK_619a63b581d7dda86a9397ac11f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_predictions" ADD CONSTRAINT "FK_94966b7fa18a25f9933d266de6c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "tax_records" ADD CONSTRAINT "FK_b2849b7dc980ca04e449457399a" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" ADD CONSTRAINT "FK_a3787b66405b239bc4c0cef4948" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_044f399afc445ec3094473acb93" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_98a04cdcbac4f6a2c55c7d19350" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_585cf990e152374b53e2f602a41" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_066b8b7c71df90bb31ea952a50d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" ADD CONSTRAINT "FK_0f70431b951afb6b76d37f631ec" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" ADD CONSTRAINT "FK_597a1287239ba4a3fbbec552cfb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_26da15632f6073c3708f6219201" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_f754faa125acaf008866b6635bc" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_f754faa125acaf008866b6635bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_26da15632f6073c3708f6219201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" DROP CONSTRAINT "FK_597a1287239ba4a3fbbec552cfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "financial_reports" DROP CONSTRAINT "FK_0f70431b951afb6b76d37f631ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_066b8b7c71df90bb31ea952a50d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_585cf990e152374b53e2f602a41"`,
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
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_98a04cdcbac4f6a2c55c7d19350"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_044f399afc445ec3094473acb93"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" DROP CONSTRAINT "FK_a3787b66405b239bc4c0cef4948"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_records" DROP CONSTRAINT "FK_b2849b7dc980ca04e449457399a"`,
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
      `ALTER TABLE "pricing_predictions" DROP CONSTRAINT "FK_94966b7fa18a25f9933d266de6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_models" DROP CONSTRAINT "FK_619a63b581d7dda86a9397ac11f"`,
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
      `ALTER TABLE "loan_requests" DROP CONSTRAINT "FK_e9e0a90731bc470fedbbc86ecea"`,
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
      `ALTER TABLE "load_templates" DROP CONSTRAINT "FK_bc954d3f801a7247cf678b4a9f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_ddb7981cf939fe620179bfea33a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_4277aa2c0e3a4a3591474dbea2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_trucks" DROP CONSTRAINT "FK_09edcc3902bee3dcf05426e3d2d"`,
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
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
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
      `DROP INDEX "public"."IDX_0ca6e3b1d21d6e54b32ea8d88b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23ce7ad7cd769295adf0fb7dd1"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "notes"`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "notes" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum_old" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'escrow')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum_old" USING "status"::"text"::"public"."payments_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payments_status_enum_old" RENAME TO "payments_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymentmethod_enum_old" AS ENUM('credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash', 'check', 'wire_transfer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "public"."payments_paymentmethod_enum_old" USING "paymentMethod"::"text"::"public"."payments_paymentmethod_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payments_paymentmethod_enum_old" RENAME TO "payments_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ca6e3b1d21d6e54b32ea8d88b" ON "payments" ("tenantId", "tripId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23ce7ad7cd769295adf0fb7dd1" ON "payments" ("paymentMethod", "paymentType") `,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentDate"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "customerName"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "customerId"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "invoiceNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "invoiceId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "processedAt"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "dueDate"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "billingAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "failureReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "gatewayResponse"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "transactionId"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentType"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payerId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tripId"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "idempotencyKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "metadata" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "processedAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "payments" ADD "dueDate" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "billingAddress" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "failureReason" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "gatewayResponse" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "transactionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "paymentType" "public"."payments_paymenttype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "currency" character varying(3) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "payerId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "tripId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "idempotencyKey" character varying`,
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
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_type_enum"`);
    await queryRunner.query(`DROP TABLE "financial_reports"`);
    await queryRunner.query(
      `DROP TYPE "public"."financial_reports_period_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."financial_reports_type_enum"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TYPE "public"."invoice_items_type_enum"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TABLE "tax_records"`);
    await queryRunner.query(`DROP TYPE "public"."tax_records_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tax_records_type_enum"`);
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
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f684fad7dfb0f0baffd6ea99b3"`,
    );
    await queryRunner.query(`DROP TABLE "lender_policies"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73ef64a4e0a6f298e63ad8e804"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3d8ef2c048340ec8452f92646"`,
    );
    await queryRunner.query(`DROP TABLE "lender_users"`);
    await queryRunner.query(`DROP TYPE "public"."lender_users_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b44909fa1fe38acfc3cf35b3dd"`,
    );
    await queryRunner.query(`DROP TABLE "lender_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7e3658732378980e80c10b3aa"`,
    );
    await queryRunner.query(`DROP TABLE "lender_permissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."lender_permissions_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lender_permissions_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dfdd03a38c678c1cd413a51611"`,
    );
    await queryRunner.query(`DROP TABLE "lenders"`);
    await queryRunner.query(`DROP TYPE "public"."lenders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_080a9cf92edbaecc889252fe4f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ecdbc56578c2f5de4fd7d24644"`,
    );
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
    await queryRunner.query(
      `DROP INDEX "public"."IDX_995a06a8d5a68474ca56cc6921"`,
    );
    await queryRunner.query(`DROP TABLE "loan_repayments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c7f21866f910eb39330b9ae245"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ee7b30ea492666d64145dea44"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f2d8564e7eb4d695c07237695"`,
    );
    await queryRunner.query(`DROP TABLE "loan_requests"`);
    await queryRunner.query(`DROP TYPE "public"."loan_requests_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6487ed4412ddfdc52ca261fb7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99e589da8f9e9326ee0d01a028"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_395720394b2b78fafdb879bd6b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87f74e36204b6338c798f5ba8e"`,
    );
    await queryRunner.query(`DROP TABLE "disputes"`);
    await queryRunner.query(`DROP TYPE "public"."disputes_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d1613f95c6a564a3b588d161a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b57ebc59c9cecb4042bba9ebc5"`,
    );
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2e3d057c72aad00dde4e01692"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_389dee553f4b96fc73104f7f91"`,
    );
    await queryRunner.query(`DROP TABLE "load_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_126be15a96309fba7823e75f57"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca2808ef437730b9653f4b321f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3e90d958270f67459f0663d52"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."notifications_deliverystatus_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab673f0e63eac966762155508e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0e5c81b11c851f8cbe2fd357d1"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ca6e3b1d21d6e54b32ea8d88b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23ce7ad7cd769295adf0fb7dd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4fb62d2d4b021d56ef49442c2"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39826ab358c6120ef1c94c9728"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d53c760355b9723023759f004"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cca52097756a60c06f44ba32b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6adb772851f4af60aa2f6107f3"`,
    );
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP TYPE "public"."routes_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."routes_routetype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1295fe8acbf4dd97725a724515"`,
    );
    await queryRunner.query(`DROP TABLE "route_trucks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47c934ba14c7f8893184544f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b39eed9ee569cf9c1607a1617"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2a6c890a6286c8f2d08cac093"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_362e8d81afdb8382910522e816"`,
    );
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_baea09a6daa36c25bc1f321699"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a5560f622ffb715d76990a84d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1b4ab364736c5c944fa609ad6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e37260a9a24b4c6ce5d4b707f7"`,
    );
    await queryRunner.query(`DROP TABLE "drivers"`);
    await queryRunner.query(`DROP TYPE "public"."drivers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."drivers_employmenttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ed6671dd1550a7602653b4d69f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b6520cb9bb8a02bf381f3457a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4213eecf7e05b183b5bdd81cd9"`,
    );
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TABLE "user_scores"`);
    await queryRunner.query(`DROP TYPE "public"."user_scores_algorithm_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_scores_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ab497cdb0d3e2da3b58f5f704"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_626a05a3e3d6cc8b488e21bc89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_276395bf346318598852569a14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48dcd4a878738f9e4b317f8284"`,
    );
    await queryRunner.query(`DROP TABLE "trucks"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_trailertype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_trucktype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trucks_fueltype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8481388d6325e752cd4d7e26c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d290ec25283e89af64958e21b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97954c0b0366e6ab20a70253d7"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_profiles_kycstatus_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_019a1bfe83abbfab615a3c3ef9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6ee2d4bf901675877bb94977c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a81d93c5706529dad43990e4a3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4717345788dc42ffa2d2848f78"`,
    );
    await queryRunner.query(`DROP TABLE "auction_views"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ca0bbd33276430d15fc09b033"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a89dfd6db31fa96d6a8e64a7d"`,
    );
    await queryRunner.query(`DROP TABLE "auctions"`);
    await queryRunner.query(`DROP TYPE "public"."auctions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."auctions_auctiontype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7bddc41671772b45a3d803db9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a2acc295677ee7a71aef6159e"`,
    );
    await queryRunner.query(`DROP TABLE "auction_watches"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ded262130947dd85545795c198"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2957b65918a614a7cd1a731a0b"`,
    );
    await queryRunner.query(`DROP TABLE "bids"`);
    await queryRunner.query(`DROP TYPE "public"."bids_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd0be03f18388566078c007fbc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75f214ed89e36b74f09240c48b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65e9985bec386b555808013671"`,
    );
    await queryRunner.query(`DROP TABLE "loads"`);
    await queryRunner.query(`DROP TYPE "public"."loads_urgencylevel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."loads_cargotype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d488a84526d22ad2b799829b7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d517a272e11c9cb9847a026ac6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1abfe8dcc106667204ac7aedce"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_type_enum"`);
    await queryRunner.query(`DROP TABLE "user_ratings"`);
    await queryRunner.query(`DROP TYPE "public"."user_ratings_category_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_ratings_ratingtype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "user_rewards"`);
    await queryRunner.query(`DROP TYPE "public"."user_rewards_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_rewards_type_enum"`);
  }
}
