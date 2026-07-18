-- =============================================================================
-- 000_base_schema.sql  —  COMPLETE FOUNDATION SCHEMA
-- =============================================================================
-- This file creates EVERY table that any later migration (001–100) depends on.
-- It is executed unconditionally as a bootstrap step before the migration loop
-- on every container start-up, so every statement MUST be idempotent:
--   • ENUMs        : DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL END $$
--   • Tables       : CREATE TABLE IF NOT EXISTS
--   • Indexes      : CREATE [UNIQUE] INDEX IF NOT EXISTS
--   • Constraints  : DO block with pg_constraint existence check
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE tenant_status AS ENUM('ACTIVE','SUSPENDED','PENDING_ACTIVATION','DEACTIVATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tenant_type AS ENUM('ENTERPRISE','SMALL_BUSINESS','INDIVIDUAL','PARTNER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tenant_kyc_status AS ENUM('PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','INCOMPLETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM('SUPER_ADMIN','ADMIN','TENANT_ADMIN','CARGO_OWNER','CARGO_RECEIVER','TRUCK_OWNER','DRIVER','AGENT','LENDER','BROKER','FLEET_MANAGER','FLEET_DISPATCHER','FLEET_ACCOUNTANT','FLEET_SAFETY_OFFICER','CUSTOMS_OFFICER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM('PENDING_VERIFICATION','ACTIVE','SUSPENDED','DEACTIVATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_status AS ENUM('PENDING','UNDER_REVIEW','VERIFIED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_requirement_level AS ENUM('BASIC','STANDARD','ENHANCED','PREMIUM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE load_status AS ENUM('DRAFT','CREATED','PUBLISHED','PENDING_CONFIRMATION','ASSIGNED','LOADED','IN_TRANSIT','DELIVERED','CLOSED','CANCELLED','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE load_type AS ENUM('FTL','LTL','REEFER','FLATBED','TANKER','INTERMODAL','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE equipment_type AS ENUM('DRY_VAN','REEFER','FLATBED','TANKER','CONTAINER','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cargo_type AS ENUM('GENERAL','FRAGILE','HAZARDOUS','REFRIGERATED','LIQUID','OVERSIZED','VALUABLE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE urgency_level AS ENUM('LOW','NORMAL','HIGH','CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE visibility_type AS ENUM('public','private'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_terms AS ENUM('Prepaid','OnDelivery','Net15','Net30','Net45','Net60'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE packaging_type AS ENUM('Palletized','Loose','Containerized','Crate','Drum','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vehicle_status AS ENUM('AVAILABLE','IN_TRANSIT','MAINTENANCE','OUT_OF_SERVICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE driver_status AS ENUM('ACTIVE','INACTIVE','SUSPENDED','ON_LEAVE','TERMINATED','IN_TRANSIT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE employment_type AS ENUM('FULL_TIME','PART_TIME','CONTRACT','OWNER_OPERATOR','FREELANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fuel_log_status AS ENUM('VERIFIED','PENDING','FLAGGED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM('credit_card','debit_card','bank_transfer','digital_wallet','cash','check','wire_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM('pending','processing','completed','failed','cancelled','refunded','escrow'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_type_enum AS ENUM('trip_payment','subscription','service_fee','deposit','refund','withdrawal','advance','final'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lender_status AS ENUM('active','paused','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE loan_request_status AS ENUM('pending','approved','rejected','disbursed','repaid','failed','defaulted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE route_status AS ENUM('active','inactive','maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE route_type AS ENUM('highway','city','rural','mixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE truck_type AS ENUM('FLATBED','BOX_TRUCK','TANKER','REFRIGERATED','CONTAINER','CAR_CARRIER','HEAVY_HAUL','LOWBED','STEP_DECK','POWER_ONLY','CURTAIN_SIDE','VAN','PLATFORM','BULK','DUMP','CEMENT_MIXER','CRANE','FIRE_TRUCK','AMBULANCE','TOW_TRUCK','GARBAGE','MILITARY','SPECIALIZED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fuel_type AS ENUM('DIESEL','GASOLINE','ELECTRIC','HYBRID','CNG','LNG'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TENANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR NOT NULL,
  subdomain               VARCHAR,
  domain                  VARCHAR,
  type                    tenant_type NOT NULL DEFAULT 'SMALL_BUSINESS',
  status                  tenant_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
  description             VARCHAR,
  "logoUrl"               VARCHAR,
  "websiteUrl"            VARCHAR,
  "contactEmail"          VARCHAR UNIQUE,
  "contactPhone"          VARCHAR,
  address                 VARCHAR,
  city                    VARCHAR,
  state                   VARCHAR,
  country                 VARCHAR,
  "postalCode"            VARCHAR,
  "taxId"                 VARCHAR,
  "businessLicense"       VARCHAR,
  settings                JSONB NOT NULL DEFAULT '{}',
  features                JSONB NOT NULL DEFAULT '{}',
  "billingInfo"           JSONB NOT NULL DEFAULT '{}',
  "maxUsers"              INTEGER,
  "maxTrucks"             INTEGER,
  "maxDrivers"            INTEGER,
  "maxLoadsPerMonth"      INTEGER,
  "subscriptionPlan"      VARCHAR,
  "subscriptionExpiresAt" TIMESTAMPTZ,
  "trialEndsAt"           TIMESTAMPTZ,
  "isActive"              BOOLEAN NOT NULL DEFAULT false,
  "activatedAt"           TIMESTAMPTZ,
  "suspendedAt"           TIMESTAMPTZ,
  "suspendedReason"       VARCHAR,
  "kycStatus"             tenant_kyc_status NOT NULL DEFAULT 'PENDING',
  "kycData"               JSONB NOT NULL DEFAULT '{}',
  "kycSubmittedAt"        TIMESTAMPTZ,
  "kycVerifiedAt"         TIMESTAMPTZ,
  "kycNotes"              VARCHAR,
  "onboardingStep"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status_type ON tenants(status, type);
CREATE INDEX IF NOT EXISTS idx_tenants_active_plan  ON tenants("isActive", "subscriptionPlan");

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email                   VARCHAR NOT NULL,
  phone                   VARCHAR,
  "passwordHash"          VARCHAR,
  "emailVerifiedAt"       TIMESTAMPTZ,
  "phoneVerifiedAt"       TIMESTAMPTZ,
  "twoFactorEnabled"      BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret"       VARCHAR,
  role                    user_role NOT NULL DEFAULT 'CARGO_OWNER',
  status                  user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "lastLoginAt"           TIMESTAMPTZ,
  "loginAttempts"         INTEGER NOT NULL DEFAULT 0,
  "lockedUntil"           TIMESTAMPTZ,
  "createdByCargoOwnerId" UUID,
  "brokerTenantId"        UUID REFERENCES tenants(id) ON DELETE SET NULL,
  "totalCommissionEarned" DECIMAL(10,2) DEFAULT 0,
  "defaultCommissionRate" DECIMAL(5,2),
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_users_created_by' AND conrelid='users'::regclass) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_created_by
      FOREIGN KEY ("createdByCargoOwnerId") REFERENCES users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email_role ON users("tenantId", email, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id  ON users("tenantId");

-- ---------------------------------------------------------------------------
-- USER PROFILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId"                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "firstName"                VARCHAR NOT NULL,
  "lastName"                 VARCHAR NOT NULL,
  "companyName"              VARCHAR,
  "taxId"                    VARCHAR,
  "businessLicense"          VARCHAR,
  address                    VARCHAR,
  "cityId"                   INTEGER,
  "postalCode"               VARCHAR,
  "countryCode"              VARCHAR,
  "avatarUrl"                VARCHAR,
  bio                        VARCHAR,
  "websiteUrl"               VARCHAR,
  "insuranceInfo"            JSONB NOT NULL DEFAULT '{}',
  "bankAccountInfo"          JSONB NOT NULL DEFAULT '{}',
  preferences                JSONB NOT NULL DEFAULT '{}',
  "kycStatus"                kyc_status NOT NULL DEFAULT 'PENDING',
  "kycDocuments"             TEXT NOT NULL DEFAULT '[]',
  "kycVerifiedAt"            TIMESTAMPTZ,
  kyc_requirement_level      kyc_requirement_level NOT NULL DEFAULT 'BASIC',
  kyc_submitted_at           TIMESTAMPTZ,
  kyc_reviewed_by            VARCHAR,
  kyc_notes                  VARCHAR,
  kyc_data                   JSONB NOT NULL DEFAULT '{}',
  identity_verified          BOOLEAN NOT NULL DEFAULT false,
  address_verified           BOOLEAN NOT NULL DEFAULT false,
  financial_verified         BOOLEAN NOT NULL DEFAULT false,
  business_verified          BOOLEAN NOT NULL DEFAULT false,
  background_check_completed BOOLEAN NOT NULL DEFAULT false,
  compliance_score           INTEGER NOT NULL DEFAULT 0,
  rating                     DECIMAL(3,2) NOT NULL DEFAULT 0,
  "totalTrips"               INTEGER NOT NULL DEFAULT 0,
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                 TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id   ON user_profiles("userId");
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_kyc        ON user_profiles("tenantId","kycStatus");
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_level         ON user_profiles(kyc_requirement_level);

-- ---------------------------------------------------------------------------
-- LOADS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loads (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"                          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "cargoOwnerId"                      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId"                        UUID REFERENCES users(id) ON DELETE SET NULL,
  "brokerId"                          UUID REFERENCES users(id) ON DELETE SET NULL,
  "brokerCommissionRate"              DECIMAL(5,2),
  "brokerCommissionAmount"            DECIMAL(15,2),
  reference                           VARCHAR,
  title                               VARCHAR NOT NULL,
  description                         TEXT,
  weight                              DECIMAL(10,2) NOT NULL,
  volume                              DECIMAL(10,2),
  "loadType"                          load_type NOT NULL DEFAULT 'FTL',
  "equipmentType"                     equipment_type NOT NULL DEFAULT 'DRY_VAN',
  "cargoType"                         cargo_type NOT NULL DEFAULT 'GENERAL',
  visibility                          visibility_type NOT NULL DEFAULT 'public',
  "unitsRequired"                     INTEGER NOT NULL DEFAULT 1,
  locations                           JSONB NOT NULL DEFAULT '[]',
  origin                              JSONB,
  destination                         JSONB,
  "pickupWindow"                      JSONB,
  "deliveryWindow"                    JSONB,
  "pickupDate"                        TIMESTAMPTZ,
  "deliveryDate"                      TIMESTAMPTZ,
  status                              load_status NOT NULL DEFAULT 'DRAFT',
  "loadValue"                         DECIMAL(15,2) NOT NULL,
  "offeredPrice"                      DECIMAL(15,2),
  "currencyCode"                      VARCHAR(3) NOT NULL DEFAULT 'USD',
  pricing                             JSONB,
  "paymentTerms"                      payment_terms NOT NULL DEFAULT 'Net30',
  "invitedCarriers"                   TEXT,
  "isFragile"                         BOOLEAN NOT NULL DEFAULT false,
  "isHazardous"                       BOOLEAN NOT NULL DEFAULT false,
  "requiresRefrigeration"             BOOLEAN NOT NULL DEFAULT false,
  "contactInfo"                       JSONB NOT NULL DEFAULT '{}',
  "autoMatchEnabled"                  BOOLEAN NOT NULL DEFAULT true,
  "matchingCriteria"                  JSONB NOT NULL DEFAULT '{}',
  "publishedAt"                       TIMESTAMPTZ,
  "assignedTruckId"                   UUID,
  "assignedCarrierId"                 UUID,
  rating                              DECIMAL(3,2) NOT NULL DEFAULT 0,
  "viewCount"                         INTEGER NOT NULL DEFAULT 0,
  length DECIMAL(8,2), width DECIMAL(8,2), height DECIMAL(8,2),
  "stackableHeight"                   DECIMAL(8,2),
  "isStackable"                       BOOLEAN NOT NULL DEFAULT false,
  "temperatureMin"                    DECIMAL(5,2),
  "temperatureMax"                    DECIMAL(5,2),
  "requiresHumidityControl"           BOOLEAN NOT NULL DEFAULT false,
  "requiresForklift"                  BOOLEAN NOT NULL DEFAULT false,
  "requiresCrane"                     BOOLEAN NOT NULL DEFAULT false,
  "requiresLoadingDock"               BOOLEAN NOT NULL DEFAULT false,
  "loadingTimeEstimate"               DECIMAL(5,2),
  "unloadingTimeEstimate"             DECIMAL(5,2),
  "hazmatClass"                       VARCHAR(50),
  "hazmatNumber"                      VARCHAR(20),
  "urgencyLevel"                      urgency_level NOT NULL DEFAULT 'NORMAL',
  "isTimeCritical"                    BOOLEAN NOT NULL DEFAULT false,
  "maxTransitTime"                    DECIMAL(5,2),
  "packagingType"                     packaging_type NOT NULL DEFAULT 'Palletized',
  "numberOfPieces"                    INTEGER NOT NULL DEFAULT 0,
  "numberOfPallets"                   INTEGER NOT NULL DEFAULT 0,
  "requiresGpsMonitoring"             BOOLEAN NOT NULL DEFAULT false,
  "requiresTemperatureMonitoring"     BOOLEAN NOT NULL DEFAULT false,
  "insuranceValue"                    DECIMAL(15,2),
  "requiresLowClearanceRoute"         BOOLEAN NOT NULL DEFAULT false,
  "maxClearanceHeight"                DECIMAL(5,2),
  "requiresEscortVehicle"             BOOLEAN NOT NULL DEFAULT false,
  "specialHandlingInstructions"       TEXT,
  "loadingInstructions"               TEXT,
  "unloadingInstructions"             TEXT,
  "emergencyContactInfo"              TEXT,
  "truckRequirements"                 JSONB NOT NULL DEFAULT '{}',
  "carrierPreferences"                JSONB NOT NULL DEFAULT '{}',
  "costPreferences"                   JSONB NOT NULL DEFAULT '{}',
  "requiresPreShipmentInspection"     BOOLEAN NOT NULL DEFAULT false,
  "requiresDeliveryInspection"        BOOLEAN NOT NULL DEFAULT false,
  "requiresPhotographicDocumentation" BOOLEAN NOT NULL DEFAULT false,
  metadata                            JSONB DEFAULT '{}',
  "createdAt"                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_loads_tenant_status ON loads("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_loads_cargo_owner   ON loads("cargoOwnerId");
CREATE INDEX IF NOT EXISTS idx_loads_reference     ON loads(reference);
CREATE INDEX IF NOT EXISTS idx_loads_visibility    ON loads(visibility);

-- ---------------------------------------------------------------------------
-- TRUCKS  (TypeORM entity — referenced by trips, fuel_wallets, fuel_logs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trucks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"            UUID NOT NULL,
  "ownerId"             UUID NOT NULL,
  "plateNumber"         VARCHAR(20) NOT NULL,
  vin                   VARCHAR(17) UNIQUE,
  make                  VARCHAR(100) NOT NULL DEFAULT '',
  model                 VARCHAR(100) NOT NULL DEFAULT '',
  year                  INTEGER NOT NULL DEFAULT 2020,
  color                 VARCHAR(50),
  "fuelType"            fuel_type NOT NULL DEFAULT 'DIESEL',
  "capacityWeight"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "capacityVolume"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "truckType"           truck_type NOT NULL DEFAULT 'FLATBED',
  status                vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  "currentLocation"     geometry(Point,4326),
  current_address       VARCHAR,
  "locationUpdatedAt"   TIMESTAMPTZ,
  "registrationNumber"  VARCHAR(50),
  "registrationExpiry"  DATE,
  "insurancePolicy"     VARCHAR(50),
  "insuranceExpiry"     DATE,
  "hasRefrigeration"    BOOLEAN NOT NULL DEFAULT false,
  "hasLiftGate"         BOOLEAN NOT NULL DEFAULT false,
  "hasGps"              BOOLEAN NOT NULL DEFAULT false,
  "hasHazmatPermit"     BOOLEAN NOT NULL DEFAULT false,
  "equipmentList"       JSONB NOT NULL DEFAULT '[]',
  "lastMaintenanceDate" DATE,
  "nextMaintenanceDate" DATE,
  mileage               INTEGER NOT NULL DEFAULT 0,
  "totalTrips"          INTEGER NOT NULL DEFAULT 0,
  "totalRevenue"        DECIMAL(15,2) NOT NULL DEFAULT 0,
  "averageRating"       DECIMAL(3,2) NOT NULL DEFAULT 0,
  "currentDriverId"     UUID,
  "currentTripId"       UUID,
  "isActive"            BOOLEAN NOT NULL DEFAULT true,
  "cargoCapabilities"   JSONB NOT NULL DEFAULT '{}',
  "loadingCapabilities" JSONB NOT NULL DEFAULT '{}',
  "securityFeatures"    JSONB NOT NULL DEFAULT '{}',
  certifications        JSONB NOT NULL DEFAULT '{}',
  "routeCapabilities"   JSONB NOT NULL DEFAULT '{}',
  "costStructure"       JSONB NOT NULL DEFAULT '{}',
  "assignedDrivers"     JSONB NOT NULL DEFAULT '[]',
  "assignedRoutes"      JSONB NOT NULL DEFAULT '[]',
  "maintenanceAlerts"   JSONB NOT NULL DEFAULT '[]',
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trucks_tenant_plate ON trucks("tenantId","plateNumber") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trucks_owner_status ON trucks("ownerId", status);

-- ---------------------------------------------------------------------------
-- DRIVERS  (TypeORM entity — referenced by trips, fuel_wallets, fuel_logs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"              UUID NOT NULL,
  "userId"                UUID NOT NULL,
  "employerId"            UUID NOT NULL,
  "employeeId"            VARCHAR,
  "firstName"             VARCHAR NOT NULL DEFAULT '',
  "lastName"              VARCHAR NOT NULL DEFAULT '',
  email                   VARCHAR NOT NULL DEFAULT '',
  phone                   VARCHAR NOT NULL DEFAULT '',
  "dateOfBirth"           DATE,
  address                 TEXT,
  "emergencyContact"      JSONB NOT NULL DEFAULT '{}',
  "licenseNumber"         VARCHAR(100) UNIQUE,
  "licenseClasses"        JSONB NOT NULL DEFAULT '[]',
  "licenseIssueDate"      DATE,
  "licenseExpiry"         DATE,
  "licenseState"          VARCHAR(100),
  "licenseCountry"        VARCHAR(100),
  endorsements            JSONB NOT NULL DEFAULT '[]',
  restrictions            JSONB NOT NULL DEFAULT '[]',
  "employmentType"        employment_type NOT NULL DEFAULT 'FULL_TIME',
  "hireDate"              DATE,
  "terminationDate"       DATE,
  status                  driver_status NOT NULL DEFAULT 'ACTIVE',
  "availabilityStatus"    VARCHAR NOT NULL DEFAULT 'AVAILABLE',
  "currentTruckId"        UUID,
  "currentTripId"         UUID,
  "currentLocation"       geometry(Point,4326),
  "locationUpdatedAt"     TIMESTAMPTZ,
  "hoursWorkedThisWeek"   DECIMAL(5,2) NOT NULL DEFAULT 0,
  "hoursWorkedThisMonth"  DECIMAL(5,2) NOT NULL DEFAULT 0,
  "lastBreakTime"         TIMESTAMPTZ,
  "consecutiveDrivingHours" INTEGER NOT NULL DEFAULT 0,
  "medicalCertExpiry"     DATE,
  "drugTestDate"          DATE,
  "backgroundCheckDate"   DATE,
  "trainingCompletionDate" DATE,
  certifications          JSONB NOT NULL DEFAULT '[]',
  rating                  DECIMAL(3,2) NOT NULL DEFAULT 0,
  "totalTrips"            INTEGER NOT NULL DEFAULT 0,
  "totalDistance"         DECIMAL(12,2) NOT NULL DEFAULT 0,
  "safetyScore"           DECIMAL(5,2) NOT NULL DEFAULT 100,
  "onTimeDeliveryRate"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "hourlyRate"            DECIMAL(10,2),
  "mileageRate"           DECIMAL(10,2),
  "totalEarnings"         DECIMAL(15,2) NOT NULL DEFAULT 0,
  experience              INTEGER,
  "driverNotes"           TEXT,
  preferences             JSONB NOT NULL DEFAULT '{}',
  "hoursOfService"        JSONB NOT NULL DEFAULT '{"breaks":[],"drivingHours":0,"onDutyHours":0,"offDutyHours":0}',
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_license ON drivers("licenseNumber") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_status ON drivers("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id       ON drivers("userId");

-- ---------------------------------------------------------------------------
-- TRIPS  (TypeORM entity — referenced by payments, fuel_wallets, loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"          UUID NOT NULL,
  "loadId"            UUID NOT NULL,
  "truckId"           UUID NOT NULL,
  "driverId"          UUID,
  "tripNumber"        VARCHAR(50) UNIQUE NOT NULL,
  status              trip_status NOT NULL DEFAULT 'PLANNED',
  "plannedStartTime"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "plannedEndTime"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualStartTime"   TIMESTAMPTZ,
  "estimatedEndTime"  TIMESTAMPTZ,
  "actualEndTime"     TIMESTAMPTZ,
  "plannedRoute"      JSONB,
  "actualRoute"       JSONB,
  "totalDistance"     DECIMAL(10,2),
  "agreedPrice"       DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currencyCode"      VARCHAR(3) NOT NULL DEFAULT 'USD',
  "fuelCost"          DECIMAL(10,2),
  "tollsCost"         DECIMAL(10,2),
  "otherExpenses"     DECIMAL(10,2),
  "totalCost"         DECIMAL(15,2),
  "profitMargin"      DECIMAL(5,2),
  "fuelEfficiency"    DECIMAL(8,2),
  "averageSpeed"      DECIMAL(8,2),
  "onTimePerformance" BOOLEAN,
  eta                 TIMESTAMPTZ,
  distance            FLOAT,
  duration            FLOAT,
  "currentLocation"   geometry(Point,4326),
  "locationUpdatedAt" TIMESTAMPTZ,
  "estimatedArrival"  TIMESTAMPTZ,
  "cargoOwnerRating"  DECIMAL(3,2),
  "cargoOwnerFeedback" TEXT,
  "driverRating"      DECIMAL(3,2),
  "driverFeedback"    TEXT,
  notes               TEXT,
  "issuesReported"    JSONB NOT NULL DEFAULT '[]',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"       TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_status ON trips("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_trips_load_id       ON trips("loadId");
CREATE INDEX IF NOT EXISTS idx_trips_truck_driver  ON trips("truckId", "driverId");

-- ---------------------------------------------------------------------------
-- PAYMENTS  (TypeORM entity — referenced by credit_transactions, subscription_payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idempotencyKey" VARCHAR,
  "tenantId"       UUID NOT NULL,
  "tripId"         UUID,
  "payerId"        UUID NOT NULL,
  "payeeId"        UUID,
  amount           DECIMAL(10,2) NOT NULL,
  currency         VARCHAR(3) NOT NULL,
  "paymentMethod"  payment_method_enum NOT NULL,
  "paymentType"    payment_type_enum NOT NULL,
  status           payment_status_enum NOT NULL DEFAULT 'pending',
  description      VARCHAR,
  "referenceNumber" VARCHAR,
  "transactionId"  VARCHAR,
  "gatewayResponse" VARCHAR,
  "failureReason"  VARCHAR,
  "billingAddress" VARCHAR,
  notes            VARCHAR,
  "dueDate"        TIMESTAMPTZ,
  "processedAt"    TIMESTAMPTZ,
  "processingFee"  DECIMAL(10,2),
  metadata         JSONB NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON payments("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id       ON payments("tripId");
CREATE INDEX IF NOT EXISTS idx_payments_payer_payee   ON payments("payerId", "payeeId");

-- ---------------------------------------------------------------------------
-- FUEL_LOGS  (TypeORM entity — referenced by fuel_wallet_transactions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  user_id          UUID NOT NULL,
  truck_id         UUID NOT NULL,
  driver_id        UUID,
  created_by       UUID NOT NULL,
  fuel_date        TIMESTAMPTZ NOT NULL,
  fuel_amount      DECIMAL(10,2) NOT NULL,
  gallons          DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_per_gallon DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost       DECIMAL(10,2) NOT NULL DEFAULT 0,
  location         VARCHAR(255) NOT NULL DEFAULT '',
  odometer         DECIMAL(10,2),
  status           fuel_log_status NOT NULL DEFAULT 'PENDING',
  receipt_number   VARCHAR(100),
  payment_method   VARCHAR(100),
  notes            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  is_flagged       BOOLEAN NOT NULL DEFAULT false,
  flag_reason      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_truck  ON fuel_logs(tenant_id, truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_driver ON fuel_logs(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_status ON fuel_logs(tenant_id, status);

-- ---------------------------------------------------------------------------
-- ACTIVITY_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  resource      VARCHAR(100),
  resource_id   VARCHAR(255),
  details       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  location      JSONB,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  session_id    VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource   ON activity_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_suspicious ON activity_logs(is_suspicious) WHERE is_suspicious = true;

-- ---------------------------------------------------------------------------
-- LENDERS  (TypeORM entity — referenced by loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lenders (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID NOT NULL,
  name                       VARCHAR(255) NOT NULL,
  api_key_hash               VARCHAR(500) NOT NULL DEFAULT '',
  callback_url               VARCHAR(500),
  outbound_api_key_encrypted VARCHAR(1000),
  webhook_secret_encrypted   VARCHAR(1000),
  contact_email              VARCHAR(255) NOT NULL DEFAULT '',
  status                     lender_status NOT NULL DEFAULT 'active',
  metadata                   JSONB,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenders_tenant_status ON lenders(tenant_id, status);

-- ---------------------------------------------------------------------------
-- LENDER_POLICIES  (TypeORM entity — Lender.policies OneToMany)
-- Required by GET /api/lending/tenant/lenders when relations: ['policies']
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lender_policies (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id                    UUID NOT NULL,
  interest_rate                NUMERIC(5,4) NOT NULL,
  repayment_term_days          INTEGER NOT NULL,
  max_advance_per_trip         NUMERIC(15,2) NOT NULL,
  max_exposure                 NUMERIC(15,2) NOT NULL,
  advance_percentage           NUMERIC(5,4) NOT NULL DEFAULT 0.7,
  currency                     VARCHAR(3) NOT NULL DEFAULT 'RWF',
  min_credit_score             INTEGER,
  max_dti_ratio                NUMERIC(5,4),
  min_business_age_months      INTEGER,
  required_kyc_level           VARCHAR(20) NOT NULL DEFAULT 'basic',
  max_ltv_ratio                NUMERIC(5,4),
  origination_fee_rate         NUMERIC(5,4) NOT NULL DEFAULT 0,
  penalty_rate                 NUMERIC(5,4) NOT NULL DEFAULT 0,
  grace_period_days            INTEGER NOT NULL DEFAULT 3,
  early_repayment_penalty_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  delinquency_threshold_days   INTEGER NOT NULL DEFAULT 30,
  default_threshold_days       INTEGER NOT NULL DEFAULT 90,
  allowed_purposes             JSON,
  is_active                    BOOLEAN NOT NULL DEFAULT true,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lender_policies_lender_created
  ON lender_policies(lender_id, created_at);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_lender_policies_lender_id'
      AND table_name = 'lender_policies'
  ) THEN
    ALTER TABLE lender_policies
      ADD CONSTRAINT FK_lender_policies_lender_id
      FOREIGN KEY (lender_id) REFERENCES lenders(id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- BORROWERS  (TypeORM entity — referenced by loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrowers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL,
  user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name         VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  contact_name         VARCHAR(255),
  email                VARCHAR(255),
  phone                VARCHAR(20),
  business_type        VARCHAR(100),
  registration_number  VARCHAR(100),
  address              TEXT,
  credit_score         INTEGER,
  status               VARCHAR(20) NOT NULL DEFAULT 'active',
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_borrowers_tenant ON borrowers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_borrowers_email_tenant ON borrowers(email, tenant_id);

-- ---------------------------------------------------------------------------
-- LOAN_REQUESTS  (TypeORM entity — referenced by loan_disbursements, loan_repayments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  cargo_id              UUID NOT NULL,
  trip_id               UUID NOT NULL,
  lender_id             UUID,
  requested_amount      DECIMAL(15,2) NOT NULL,
  approved_amount       DECIMAL(15,2),
  status                loan_request_status NOT NULL DEFAULT 'pending',
  idempotency_key       VARCHAR(255) UNIQUE NOT NULL,
  interest_amount       DECIMAL(15,2),
  due_date              DATE,
  created_by            UUID NOT NULL,
  borrower_id           UUID,
  external_loan_ref     VARCHAR(255),
  rejection_reason      TEXT,
  requested_split       JSON,
  metadata              JSON,
  loan_number           VARCHAR(50) UNIQUE,
  purpose               VARCHAR(100),
  kyc_verified          BOOLEAN NOT NULL DEFAULT false,
  currency              VARCHAR(3) NOT NULL DEFAULT 'RWF',
  origination_fee_rate  DECIMAL(5,4),
  origination_fee_amount DECIMAL(15,2),
  total_cost_of_credit  DECIMAL(15,2),
  apr                   DECIMAL(7,4),
  collateral_description VARCHAR(500),
  collateral_value      DECIMAL(15,2),
  ltv_ratio             DECIMAL(5,4),
  grace_period_end      DATE,
  days_past_due         INTEGER NOT NULL DEFAULT 0,
  ifrs9_stage           INTEGER NOT NULL DEFAULT 1,
  risk_score            DECIMAL(5,2),
  risk_tier             VARCHAR(20),
  pd_at_origination     DECIMAL(6,4),
  lgd_at_origination    DECIMAL(6,4),
  expected_loss         DECIMAL(6,4),
  repaid_at             TIMESTAMPTZ,
  defaulted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_requests_tenant_status ON loan_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_lender        ON loan_requests(lender_id);

-- ---------------------------------------------------------------------------
-- ROUTES  (TypeORM entity — referenced by route_trucks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"       UUID NOT NULL,
  name             VARCHAR(100) NOT NULL,
  origin           VARCHAR(100) NOT NULL,
  destination      VARCHAR(100) NOT NULL,
  origin_lat       DECIMAL(10,7),
  origin_lng       DECIMAL(10,7),
  origin_address   VARCHAR(255),
  destination_lat  DECIMAL(10,7),
  destination_lng  DECIMAL(10,7),
  destination_address VARCHAR(255),
  distance         DECIMAL(10,2) NOT NULL DEFAULT 0,
  "estimatedTime"  INTEGER NOT NULL DEFAULT 0,
  "routeType"      route_type NOT NULL DEFAULT 'highway',
  status           route_status NOT NULL DEFAULT 'active',
  "assignedTrucks" JSONB NOT NULL DEFAULT '[]',
  "assignedDrivers" JSONB NOT NULL DEFAULT '[]',
  description      VARCHAR,
  created_by       UUID,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_tenant_name ON routes("tenantId", name) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- EPODS  (full schema — create table then ADD COLUMN IF NOT EXISTS for upgrades)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE epod_status_enum AS ENUM ('PENDING','CONFIRMED','DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cargo_condition_on_delivery_enum AS ENUM (
    'INTACT','PARTIAL_DAMAGE','SHORT_DELIVERY','FULL_DAMAGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS epods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"            UUID NOT NULL,
  "tripId"              UUID UNIQUE,
  "driverId"            UUID,
  "cargoOwnerId"        UUID,
  "recipientName"       VARCHAR(200),
  "recipientPhone"      VARCHAR(50),
  "recipientIdNumber"   VARCHAR(100),
  "recipientCompany"    VARCHAR(200),
  "signatureFileUrl"    VARCHAR(500),
  "photoUrls"           JSONB NOT NULL DEFAULT '[]',
  "deliveredAt"         TIMESTAMPTZ,
  "deliveryNotes"       TEXT,
  "odometerReading"     VARCHAR(100),
  "deliveryAddress"     TEXT,
  "deliveryCoordinates" JSONB,
  "cargoCondition"      cargo_condition_on_delivery_enum NOT NULL DEFAULT 'INTACT',
  "unitsDelivered"      VARCHAR(100),
  "exceptionNotes"      TEXT,
  status                epod_status_enum NOT NULL DEFAULT 'PENDING',
  "submittedAt"         TIMESTAMPTZ,
  "confirmedAt"         TIMESTAMPTZ,
  "disputedAt"          TIMESTAMPTZ,
  "disputeReason"       TEXT,
  "invoiceId"           UUID,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill any columns missing on pre-existing epods tables
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "driverId"            UUID;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "cargoOwnerId"        UUID;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientName"       VARCHAR(200);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientPhone"      VARCHAR(50);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientIdNumber"   VARCHAR(100);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientCompany"    VARCHAR(200);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "signatureFileUrl"    VARCHAR(500);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "photoUrls"           JSONB;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "deliveredAt"         TIMESTAMPTZ;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "deliveryNotes"       TEXT;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "odometerReading"     VARCHAR(100);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "deliveryAddress"     TEXT;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "deliveryCoordinates" JSONB;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "unitsDelivered"      VARCHAR(100);
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "exceptionNotes"      TEXT;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "submittedAt"         TIMESTAMPTZ;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "confirmedAt"         TIMESTAMPTZ;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "disputedAt"          TIMESTAMPTZ;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "disputeReason"       TEXT;
ALTER TABLE epods ADD COLUMN IF NOT EXISTS "invoiceId"           UUID;
DO $$ BEGIN
  ALTER TABLE epods ADD COLUMN "cargoCondition" cargo_condition_on_delivery_enum NOT NULL DEFAULT 'INTACT';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
-- Note: if epods.status already exists as VARCHAR, we leave it as-is.
-- The application and migration 041 handle the enum conversion explicitly.

CREATE INDEX IF NOT EXISTS idx_epods_tenant      ON epods("tenantId");
CREATE INDEX IF NOT EXISTS idx_epods_cargo_owner ON epods("cargoOwnerId");
CREATE INDEX IF NOT EXISTS idx_epods_cargo_cond  ON epods("cargoCondition");


-- ---------------------------------------------------------------------------
-- PERMISSIONS & ROLES  (TypeORM RBAC — referenced by 021, 026)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  resource    VARCHAR(100) NOT NULL,
  action      VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource, action);

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  "tenantId"  UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TypeORM migrations tracking table (referenced by migration 012)
CREATE TABLE IF NOT EXISTS migrations (
  id        SERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  name      VARCHAR(255) NOT NULL
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS  (TypeORM entity — referenced by 018, 037)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"         UUID NOT NULL,
  "userId"           UUID REFERENCES users(id) ON DELETE CASCADE,
  title              VARCHAR(500),
  message            TEXT,
  "notificationType" VARCHAR(100),
  "entityType"       VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  "entityId"         UUID,
  "isRead"           BOOLEAN NOT NULL DEFAULT false,
  "readAt"           TIMESTAMPTZ,
  metadata           JSONB NOT NULL DEFAULT '{}',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user  ON notifications("tenantId", "userId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_read    ON notifications("userId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_entity       ON notifications("entityType", "entityId");

-- ---------------------------------------------------------------------------
-- DISPUTES_V2  (referenced by migration 050)
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE dispute_status_v2 AS ENUM (
  'OPEN','IN_REVIEW','RESOLVED','CLOSED','ESCALATED','ASSIGNED','INVESTIGATING'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE dispute_category AS ENUM (
  'PAYMENT','DAMAGE','DELAY','SERVICE','DOCUMENTATION','OTHER',
  'TRUCK_BREAKDOWN','AUCTION_ISSUE','BROKER_COMPLAINT','LENDER_COMPLAINT',
  'IDENTITY_VERIFICATION','INSURANCE_CLAIM','ACCOUNT_SUSPENSION',
  'TECHNICAL_PROBLEM','BILLING_ISSUE','SUBSCRIPTION_ISSUE',
  'FEATURE_REQUEST','SECURITY_CONCERN'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS disputes_v2 (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"                  UUID NOT NULL,
  "reportedById"              UUID REFERENCES users(id) ON DELETE SET NULL,
  "againstId"                 UUID REFERENCES users(id) ON DELETE SET NULL,
  category                    dispute_category NOT NULL DEFAULT 'OTHER',
  status                      dispute_status_v2 NOT NULL DEFAULT 'OPEN',
  subject                     VARCHAR(500),
  description                 TEXT,
  resolution                  TEXT,
  ticket_number               VARCHAR(30),
  assigned_to_user_id         UUID,
  assigned_role               VARCHAR(50),
  assigned_at                 TIMESTAMPTZ,
  auction_id                  UUID,
  payment_id                  UUID,
  driver_id                   UUID,
  broker_id                   UUID,
  lender_id                   UUID,
  location                    VARCHAR(500),
  incident_date               TIMESTAMPTZ,
  additional_notes            TEXT,
  sla_first_response_due      TIMESTAMPTZ,
  sla_resolution_due          TIMESTAMPTZ,
  first_response_at           TIMESTAMPTZ,
  sla_first_response_breached BOOLEAN NOT NULL DEFAULT false,
  sla_resolution_breached     BOOLEAN NOT NULL DEFAULT false,
  reopen_count                INTEGER NOT NULL DEFAULT 0,
  escalation_level            INTEGER NOT NULL DEFAULT 0,
  escalation_reason           VARCHAR(60),
  escalated_at                TIMESTAMPTZ,
  escalated_by_user_id        UUID,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_v2_ticket ON disputes_v2(ticket_number) WHERE ticket_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_v2_tenant ON disputes_v2("tenantId", status);

CREATE TABLE IF NOT EXISTS dispute_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes_v2(id) ON DELETE CASCADE,
  "userId"   UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  old_value  JSONB,
  new_value  JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispute_audit_dispute ON dispute_audit_logs(dispute_id, "createdAt" DESC);

-- ---------------------------------------------------------------------------
-- APPLICATION-LEVEL TABLES  (TypeORM entities used at startup)
-- ---------------------------------------------------------------------------

-- SYSTEM_SETTINGS  (read at app init by SystemSettingsService)
CREATE TABLE IF NOT EXISTS system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    VARCHAR(50) NOT NULL,
  key         VARCHAR(100) NOT NULL,
  value       JSONB NOT NULL,
  data_type   VARCHAR(20) NOT NULL DEFAULT 'string',
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  updated_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_cat_key ON system_settings(category, key);

-- CURRENCIES  (read at app init by CurrencyService)
CREATE TABLE IF NOT EXISTS currencies (
  code        VARCHAR(3) PRIMARY KEY,
  name        VARCHAR(64) NOT NULL,
  symbol      VARCHAR(16) NOT NULL,
  locale      VARCHAR(16) NOT NULL DEFAULT 'en-US',
  decimals    INTEGER NOT NULL DEFAULT 2,
  flag        VARCHAR(8) NOT NULL DEFAULT '🏳',
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "manualRate" DECIMAL(20,8),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXCHANGE_RATES  (read at app init by CurrencyService)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "baseCurrency"   VARCHAR(3) NOT NULL DEFAULT 'USD',
  "targetCurrency" VARCHAR(3) NOT NULL,
  rate             DECIMAL(20,8) NOT NULL,
  source           VARCHAR,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates("baseCurrency", "targetCurrency");
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched    ON exchange_rates(fetched_at);

-- TRUCKS: add columns that TypeORM entity expects but migration didn't add
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "estimatedAvailableTime" TIMESTAMPTZ;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRefrigeration"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLiftGate"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasGps"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHazmatPermit"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "trailerType"        VARCHAR(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "roadworthyCertExpiry" DATE;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "fuelEfficiency"     DECIMAL(8,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "inspectionAlerts"   JSONB;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "insuranceAlerts"    JSONB;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "fuelAlerts"         JSONB;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "tireAlerts"         JSONB;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "complianceAlerts"   JSONB;

-- ---------------------------------------------------------------------------
-- REFRESH_TOKENS  (auth — login fails without this)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"   UUID NOT NULL,
  token      VARCHAR NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  "revokedAt" TIMESTAMPTZ,
  "revokedBy" VARCHAR,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked ON refresh_tokens("userId", revoked, "expiresAt");

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS  (full schema matching TypeORM entity)
-- ---------------------------------------------------------------------------
-- Drop the stub created earlier and replace with the full entity schema.
-- All via ALTER TABLE ADD COLUMN IF NOT EXISTS — safe on both fresh and
-- existing tables that already have the base columns.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "recipientId"       UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "notificationType"  VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category            VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status              VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "shortMessage"      TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channels            JSONB NOT NULL DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "channelData"       JSONB NOT NULL DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tags                JSONB NOT NULL DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "scheduledAt"       TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "sentAt"            TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "deliveredAt"       TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "readAt"            TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "expiresAt"         TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "isArchived"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "requiresAction"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "actionUrl"         TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "actionText"        TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "actionData"        JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS attachments         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "deliveryAttempts"  JSONB NOT NULL DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "userPreferences"   JSONB NOT NULL DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS analytics           JSONB NOT NULL DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "relatedNotifications" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "workflowInfo"      JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "escalationInfo"    JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "complianceInfo"    JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ;

-- Indexes for notifications (all IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read   ON notifications("tenantId", "recipientId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status ON notifications("recipientId", status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled        ON notifications("scheduledAt", status);

-- ---------------------------------------------------------------------------
-- AUCTIONS  (full schema matching TypeORM entity)
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE auction_status AS ENUM (
  'SCHEDULED','ACTIVE','CLOSED','CANCELLED','PAUSED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE auction_type AS ENUM (
  'REVERSE','FORWARD','DUTCH','SEALED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS auctions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loadId"              UUID NOT NULL,
  "auctionType"         auction_type NOT NULL DEFAULT 'REVERSE',
  status                auction_status NOT NULL DEFAULT 'SCHEDULED',
  "auctionStart"        TIMESTAMPTZ NOT NULL,
  "auctionEnd"          TIMESTAMPTZ NOT NULL,
  "reservePrice"        DECIMAL(15,2),
  "minimumBidIncrement" DECIMAL(15,2),
  "maximumBidAmount"    DECIMAL(15,2),
  "targetPrice"         DECIMAL(15,2),
  "maxBudget"           DECIMAL(15,2),
  "startingPrice"       DECIMAL(15,2),
  "marketRate"          DECIMAL(15,2),
  "dropInterval"        INTEGER,
  "dropAmount"          DECIMAL(15,2),
  "bidVisibility"       VARCHAR(50) DEFAULT 'HIDDEN',
  "allowBidRevision"    BOOLEAN DEFAULT false,
  "selectionCriteria"   VARCHAR(50) DEFAULT 'LOWEST_BID',
  "autoExtend"          BOOLEAN DEFAULT false,
  "minimumBidDecrement" DECIMAL(15,2),
  "totalBids"           INTEGER NOT NULL DEFAULT 0,
  "uniqueBidders"       INTEGER NOT NULL DEFAULT 0,
  "currentHighestBid"   DECIMAL(15,2),
  "winningBidId"        UUID,
  "winningBidderId"     UUID,
  "awardedAt"           TIMESTAMPTZ,
  "auctionRules"        JSONB NOT NULL DEFAULT '{}',
  "notificationSettings" JSONB NOT NULL DEFAULT '{}',
  analytics             JSONB NOT NULL DEFAULT '{}',
  "cancellationReason"  TEXT,
  "cancelledBy"         UUID,
  "cancelledAt"         TIMESTAMPTZ,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_auctions_load_status  ON auctions("loadId", status);
CREATE INDEX IF NOT EXISTS idx_auctions_start_end    ON auctions("auctionStart", "auctionEnd");

-- BIDS  (TypeORM Bid entity — single source of truth)
-- Do NOT create a stub schema here; see migration 052 for dual-schema history.
DO $$ BEGIN CREATE TYPE bid_status AS ENUM (
  'PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS bids (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"                  UUID NOT NULL,
  "loadId"                    UUID NOT NULL,
  "truckOwnerId"              UUID NOT NULL,
  "bidAmount"                 DECIMAL(15,2) NOT NULL,
  "bidCurrency"               VARCHAR(3) NOT NULL DEFAULT 'USD',
  "proposedPickupDate"        TIMESTAMPTZ,
  "proposedDeliveryDate"      TIMESTAMPTZ,
  status                      bid_status NOT NULL DEFAULT 'PENDING',
  "bidNotes"                  TEXT,
  "bidDetails"                JSONB NOT NULL DEFAULT '{}',
  "successProbability"        DECIMAL(5,2),
  "riskAssessment"            JSONB NOT NULL DEFAULT '{}',
  "marketContext"             JSONB NOT NULL DEFAULT '{}',
  "isAutoBid"                 BOOLEAN NOT NULL DEFAULT false,
  "isCounterOffer"            BOOLEAN NOT NULL DEFAULT false,
  "parentBidId"               UUID,
  "advancePaymentPercentage"  DECIMAL(5,2),
  "requireAdvancePayment"     BOOLEAN NOT NULL DEFAULT true,
  "expiresAt"                 TIMESTAMPTZ,
  "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bids_load             ON bids("loadId", status);
CREATE INDEX IF NOT EXISTS idx_bids_truck_owner_status ON bids("truckOwnerId", status);
CREATE INDEX IF NOT EXISTS idx_bids_tenant_status    ON bids("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_bids_load_owner_status ON bids("loadId", "truckOwnerId", status);

-- AUCTION_VIEWS  (referenced by Auction entity)
CREATE TABLE IF NOT EXISTS auction_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "auctionId" UUID NOT NULL,
  "viewerId"  UUID,
  "viewedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_views_auction ON auction_views("auctionId");

-- AUCTION_WATCHES  (referenced by Auction entity)
CREATE TABLE IF NOT EXISTS auction_watches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "auctionId" UUID NOT NULL,
  "watcherId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_watches_uniq ON auction_watches("auctionId", "watcherId");

-- ---------------------------------------------------------------------------
-- AUDIT_LOGS  (auth service writes here on every login)
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE audit_action AS ENUM (
  'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','PAYMENT','DISPUTE','OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL,
  "userId"    UUID NOT NULL,
  action      audit_action NOT NULL DEFAULT 'OTHER',
  description TEXT NOT NULL DEFAULT '',
  metadata    JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action ON audit_logs("tenantId", action, "createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user         ON audit_logs("userId", "createdAt");

-- ---------------------------------------------------------------------------
-- LOCATIONS  (FK target for trips.pickupLocationId / deliveryLocationId)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"          UUID NOT NULL,
  name                VARCHAR NOT NULL,
  address             TEXT NOT NULL DEFAULT '',
  "cityId"            INTEGER,
  "postalCode"        VARCHAR,
  city                VARCHAR,
  state               VARCHAR,
  country             VARCHAR,
  region              VARCHAR,
  district            VARCHAR,
  neighborhood        VARCHAR,
  landmark            VARCHAR,
  "locationCategory"  VARCHAR,
  "locationSubCategory" VARCHAR,
  "businessHours"     VARCHAR,
  timezone            VARCHAR,
  "accessType"        VARCHAR,
  "parkingAvailable"  BOOLEAN,
  "securityLevel"     VARCHAR,
  "loadingDockCount"  INTEGER,
  "maxTruckHeight"    DECIMAL(8,2),
  "maxTruckWeight"    DECIMAL(8,2),
  "specialInstructions" VARCHAR,
  coordinates         geometry(Point,4326),
  "locationType"      VARCHAR NOT NULL DEFAULT 'GENERAL',
  "contactInfo"       JSONB NOT NULL DEFAULT '{}',
  "operatingHours"    JSONB NOT NULL DEFAULT '{}',
  facilities          JSONB NOT NULL DEFAULT '{}',
  "accessInstructions" VARCHAR,
  "isActive"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations("tenantId", "isActive");

-- TRIPS: add FK columns for pickup/delivery locations
ALTER TABLE trips ADD COLUMN IF NOT EXISTS "pickupLocationId"  UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS "deliveryLocationId" UUID;

-- ---------------------------------------------------------------------------
-- ACTIVITY_LOGS: drop the FK constraint so logging never fails due to
-- referential integrity (activity logs are observational — they must never
-- block the primary operation they're recording).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activity_logs_user_id_fkey'
    AND conrelid = 'activity_logs'::regclass
  ) THEN
    ALTER TABLE activity_logs DROP CONSTRAINT activity_logs_user_id_fkey;
    RAISE NOTICE 'Dropped activity_logs_user_id_fkey FK constraint';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASSWORD_RESET_TOKENS  (user creation / password setup fails without this)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR NOT NULL,
  token      VARCHAR NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_email_used ON password_reset_tokens(email, used, "expiresAt");

-- ---------------------------------------------------------------------------
-- EMAIL_VERIFICATION_TOKENS  (same pattern — add proactively)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR NOT NULL,
  token      VARCHAR NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evt_email_used ON email_verification_tokens(email, used, "expiresAt");

-- ---------------------------------------------------------------------------
-- TRUCKS: add all dimension/feature columns the TypeORM entity expects
-- TypeORM SELECT queries every mapped column — missing ones crash the query
-- ---------------------------------------------------------------------------
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "maxLength"                 DECIMAL(8,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "maxWidth"                  DECIMAL(8,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "maxHeight"                 DECIMAL(8,2);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasSideRails"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTarps"                  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasStraps"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasChains"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasWinch"                  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRam"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTailLift"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasSideLift"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRollerBed"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDropDeck"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasExtendable"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLowbed"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasStepDeck"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasPowerOnly"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasContainerChassis"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTanker"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasBulk"                   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRefrigerated"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHeated"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasVentilated"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCurtainSide"            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasBox"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasVan"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasPlatform"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCarCarrier"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHeavyHaul"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasOversized"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHazmat"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDangerousGoods"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFoodGrade"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasPharmaceutical"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLiquid"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDryBulk"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasGas"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasChemical"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasWaste"                  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasReefer"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFrozen"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasChilled"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasAmbient"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasControlledAtmosphere"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHumidityControl"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTemperatureMonitoring"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasGPS"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTracking"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTelematics"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasELD"                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDashCam"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasSafetyCameras"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCollisionAvoidance"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLaneDeparture"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasAdaptiveCruise"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasBlindSpot"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasBackupCamera"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTirePressureMonitoring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasEngineMonitoring"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFuelMonitoring"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasMaintenanceAlerts"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDriverMonitoring"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFatigueMonitoring"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasSpeedMonitoring"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasIdleMonitoring"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRouteOptimization"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasRealTimeTracking"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasGeofencing"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTemperatureAlerts"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasHumidityAlerts"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasShockMonitoring"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasTiltMonitoring"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasDoorMonitoring"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCargoMonitoring"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasWeightMonitoring"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasVolumeMonitoring"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasPressureMonitoring"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFlowMonitoring"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLevelMonitoring"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasQualityMonitoring"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasContaminationMonitoring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasLeakDetection"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasOverfillProtection"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasEmergencyShutdown"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFireSuppression"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasExplosionProof"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCorrosionResistant"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasStainlessSteel"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasAluminum"               BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasCarbonSteel"            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasFiberglass"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasPlastic"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasComposite"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "hasInsulated"              BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- ROLE_PERMISSIONS junction table  (TypeORM @ManyToMany JoinTable)
-- The PermissionService queries: JOIN role_permissions rp ON p.id = rp.permission_id
-- Our earlier roles table didn't create this junction table at all.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL,
  permission_id UUID NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);
-- role_permissions: add columns if they exist in the table already under different names,
-- then create indexes only when the columns are confirmed present.
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id       UUID;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_permissions' AND column_name = 'role_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_role_permissions_role       ON role_permissions(role_id);
    CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
  END IF;
END $$;

-- ROLE_INHERITANCE junction table (also defined in Role entity)
CREATE TABLE IF NOT EXISTS role_inheritance (
  role_id                UUID NOT NULL,
  inherits_from_role_id  UUID NOT NULL,
  PRIMARY KEY (role_id, inherits_from_role_id)
);

-- Roles table: add missing columns the entity expects
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Permissions table: add missing columns the entity expects
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ---------------------------------------------------------------------------
-- BIDS  — ensure entity columns exist on older DBs that still have the stub
-- (CREATE TABLE IF NOT EXISTS above is a no-op when the stub already exists.
--  Migration 052 fully retires stub columns; this block is a safe fallback.)
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE bid_status AS ENUM (
  'PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS "truckOwnerId"              UUID;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidAmount"                 DECIMAL(15,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidCurrency"               VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "proposedPickupDate"        TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "proposedDeliveryDate"      TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidNotes"                  TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidDetails"                JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "successProbability"        DECIMAL(5,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "riskAssessment"            JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "marketContext"             JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "isAutoBid"                 BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "isCounterOffer"            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "parentBidId"               UUID;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "advancePaymentPercentage"  DECIMAL(5,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "requireAdvancePayment"     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "expiresAt"                 TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE bids ADD COLUMN IF NOT EXISTS deleted_at                  TIMESTAMPTZ;

-- Convert bids.status to bid_status enum if it's still varchar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE bids ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE bids ALTER COLUMN status TYPE bid_status USING status::bid_status;
    ALTER TABLE bids ALTER COLUMN status SET DEFAULT 'PENDING';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bids_truck_owner_status ON bids("truckOwnerId", status);

-- ===========================================================================
-- BATCH: All remaining TypeORM entity tables (added together to end whack-a-mole)
-- ===========================================================================

-- MAINTENANCE_LOGS
DO $$ BEGIN CREATE TYPE maintenance_type AS ENUM('ROUTINE','REPAIR','EMERGENCY','INSPECTION','FAULT_REPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_status AS ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"      UUID NOT NULL,
  "truckId"       UUID NOT NULL,
  "driverId"      UUID,
  type            maintenance_type NOT NULL DEFAULT 'ROUTINE',
  "taskName"      VARCHAR(255) NOT NULL DEFAULT '',
  description     TEXT,
  "serviceDate"   DATE,
  "providerName"  VARCHAR(255),
  status          maintenance_status NOT NULL DEFAULT 'PENDING',
  cost            DECIMAL(12,2) NOT NULL DEFAULT 0,
  "odometerReading" INTEGER,
  "partsReplaced" JSONB,
  notes           TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_tenant_truck ON maintenance_logs("tenantId","truckId");
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_truck_status ON maintenance_logs("truckId", status);

-- EXPENSES
DO $$ BEGIN CREATE TYPE expense_type AS ENUM('fuel','maintenance','toll','driver','insurance','tax','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE expense_status AS ENUM('pending','approved','rejected','paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type expense_type NOT NULL,
  category VARCHAR NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description VARCHAR NOT NULL DEFAULT '',
  "truckId" UUID, "driverId" UUID, "tripId" UUID,
  receipt VARCHAR, status expense_status NOT NULL DEFAULT 'pending',
  "approvedBy" UUID, "approvedDate" TIMESTAMPTZ, notes TEXT,
  "taxDeductible" BOOLEAN NOT NULL DEFAULT true,
  "allocationCustomerId" UUID, "allocationTripId" UUID,
  "allocationPercentage" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "createdBy" UUID NOT NULL, "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses("tenantId");

-- INVOICES / INVOICE_ITEMS (financial module — required by GET /api/financial/invoices)
DO $$ BEGIN CREATE TYPE invoices_status_enum AS ENUM('draft','sent','paid','overdue','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_items_type_enum AS ENUM('freight','fuel_surcharge','toll','detention','lumper','accessorial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber" VARCHAR NOT NULL,
  "customerId" VARCHAR NOT NULL,
  "customerName" VARCHAR NOT NULL,
  "senderId" VARCHAR,
  "senderName" VARCHAR,
  "tripId" VARCHAR,
  "truckId" VARCHAR,
  "driverId" VARCHAR,
  "issueDate" TIMESTAMP NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  status invoices_status_enum NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  currency VARCHAR NOT NULL DEFAULT 'USD',
  notes TEXT,
  "paymentTerms" VARCHAR NOT NULL DEFAULT 'Net 30',
  "paymentMethod" VARCHAR,
  "paidDate" TIMESTAMP,
  "lateFees" DECIMAL(10,2),
  "createdBy" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_invoice_number ON invoices("invoiceNumber");
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices("tenantId");
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices("issueDate");

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  type invoice_items_type_enum NOT NULL,
  "tripId" VARCHAR,
  notes TEXT,
  "invoiceId" UUID,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items("invoiceId");

-- SAFETY_INCIDENTS
DO $$ BEGIN CREATE TYPE incident_type AS ENUM('accident','near_miss','injury','property_damage','traffic_violation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE incident_severity AS ENUM('minor','moderate','major','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE incident_status AS ENUM('reported','investigating','resolved','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type incident_type NOT NULL,
  severity incident_severity NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  "driverId" UUID, "driverName" VARCHAR(255),
  "truckId" UUID, "truckPlate" VARCHAR(50),
  "weatherConditions" VARCHAR(100), "roadConditions" VARCHAR(100),
  injuries TEXT, "propertyDamage" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "policeReport" BOOLEAN NOT NULL DEFAULT false, "reportNumber" VARCHAR(100),
  status incident_status NOT NULL DEFAULT 'reported',
  "assignedTo" VARCHAR(255), "correctiveActions" JSON,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  "insuranceClaim" BOOLEAN NOT NULL DEFAULT false, "claimNumber" VARCHAR(100),
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_tenant ON safety_incidents("tenantId", date);

-- SAFETY_INSPECTIONS
DO $$ BEGIN CREATE TYPE inspection_type AS ENUM('pre_trip','post_trip','weekly','monthly','annual','random'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inspection_status AS ENUM('passed','failed','conditional'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE compliance_status AS ENUM('compliant','non_compliant'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type inspection_type NOT NULL,
  inspector VARCHAR(255) NOT NULL DEFAULT '',
  "inspectionDate" TIMESTAMPTZ NOT NULL,
  "truckId" UUID, "truckPlate" VARCHAR(50),
  "driverId" UUID, "driverName" VARCHAR(255),
  status inspection_status NOT NULL,
  score INTEGER NOT NULL DEFAULT 0, "maxScore" INTEGER NOT NULL DEFAULT 100,
  items JSON, notes TEXT, "nextInspectionDate" TIMESTAMPTZ,
  "complianceStatus" compliance_status NOT NULL DEFAULT 'compliant',
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_tenant ON safety_inspections("tenantId","inspectionDate");

-- SAFETY_TRAININGS
DO $$ BEGIN CREATE TYPE training_type AS ENUM('defensive_driving','hazmat','first_aid','emergency_procedures','regulations','technology'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE training_status AS ENUM('completed','pending','overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE training_frequency AS ENUM('once','annually','biannually','quarterly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS safety_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  type training_type NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT, duration INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false,
  frequency training_frequency,
  "lastCompleted" TIMESTAMPTZ, "nextDue" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status training_status NOT NULL DEFAULT 'pending',
  "driverId" UUID, "driverName" VARCHAR(255),
  instructor VARCHAR(255) NOT NULL DEFAULT '',
  score INTEGER, certificate VARCHAR(100),
  "scheduledDate" TIMESTAMPTZ, "createdBy" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_safety_trainings_tenant ON safety_trainings("tenantId", "nextDue");

-- TRACKING_EVENTS
DO $$ BEGIN CREATE TYPE tracking_event_type AS ENUM('Location','GeofenceEnter','GeofenceExit','Delay','Incident','StatusChange','DocumentUpload','Alert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE geofence_type AS ENUM('pickup','delivery','custom','restricted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loadId" UUID NOT NULL,
  type tracking_event_type NOT NULL,
  latitude DECIMAL(10,8), longitude DECIMAL(11,8),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "speedKph" DECIMAL(5,2), "headingDeg" DECIMAL(5,2),
  "accuracyM" DECIMAL(5,2), altitude DECIMAL(5,2), "altitudeAccuracy" DECIMAL(5,2),
  address TEXT, city TEXT, state TEXT, country TEXT, "postalCode" TEXT,
  "geofenceId" TEXT, "geofenceType" geofence_type, "geofenceName" TEXT,
  data JSONB, description TEXT, notes TEXT,
  "reportedBy" UUID, "isAutomated" BOOLEAN NOT NULL DEFAULT false,
  "requiresAction" BOOLEAN NOT NULL DEFAULT false,
  "actionTakenAt" TIMESTAMPTZ, "actionTakenBy" UUID, "actionTaken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_load ON tracking_events("loadId");
CREATE INDEX IF NOT EXISTS idx_tracking_events_time ON tracking_events(timestamp);

-- MESSAGES
DO $$ BEGIN CREATE TYPE message_role AS ENUM('DRIVER','SHIPPER','CARGO_OWNER','TRUCK_OWNER','DISPATCH','SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(255) NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_role message_role NOT NULL DEFAULT 'SYSTEM',
  is_read BOOLEAN NOT NULL DEFAULT false,
  trip_id UUID, load_id UUID, tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);

-- DOCUMENTS
DO $$ BEGIN CREATE TYPE document_category AS ENUM('IDENTITY','LICENSE','INSURANCE','CERTIFICATION','COMPLIANCE','FINANCIAL','OPERATIONAL','LEGAL','CARGO','DRIVER','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_priority AS ENUM('LOW','NORMAL','HIGH','URGENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "entityType" VARCHAR(50) NOT NULL,
  "entityId" UUID NOT NULL,
  "documentType" VARCHAR(100) NOT NULL,
  category document_category NOT NULL DEFAULT 'OTHER',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  priority document_priority NOT NULL DEFAULT 'NORMAL',
  "documentNumber" VARCHAR,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  "fileName" TEXT NOT NULL DEFAULT '',
  "originalFileName" TEXT NOT NULL DEFAULT '',
  "fileUrl" TEXT NOT NULL DEFAULT '',
  "thumbnailUrl" TEXT,
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "mimeType" VARCHAR NOT NULL DEFAULT '',
  "fileExtension" VARCHAR,
  "issueDate" DATE, "expiryDate" DATE,
  "isExpired" BOOLEAN NOT NULL DEFAULT false,
  "requiresRenewal" BOOLEAN NOT NULL DEFAULT false,
  "renewalReminderDays" INTEGER NOT NULL DEFAULT 30,
  metadata JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',
  "uploadedBy" UUID NOT NULL,
  "verifiedBy" UUID, "verifiedAt" TIMESTAMPTZ, "verificationNotes" TEXT,
  "verificationData" JSONB NOT NULL DEFAULT '{}',
  versions JSONB NOT NULL DEFAULT '[]',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "accessControl" JSONB NOT NULL DEFAULT '[]',
  "auditTrail" JSONB NOT NULL DEFAULT '[]',
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "isConfidential" BOOLEAN NOT NULL DEFAULT false,
  "encryptionKey" VARCHAR,
  "ocrData" JSONB NOT NULL DEFAULT '{}',
  "digitalSignature" JSONB NOT NULL DEFAULT '{}',
  "complianceInfo" JSONB NOT NULL DEFAULT '{}',
  "workflowInfo" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents("entityType","entityId");
CREATE INDEX IF NOT EXISTS idx_documents_tenant  ON documents("tenantId","entityType");

-- REVENUE_RECORDS
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tripId" UUID NOT NULL UNIQUE,
  "loadId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "brokerId" UUID,
  "grossAmount" DECIMAL(15,2) NOT NULL,
  "platformFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
  "platformFeeAmount" DECIMAL(15,2) NOT NULL,
  "brokerCommissionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "netPayoutAmount" DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  "isSettled" BOOLEAN NOT NULL DEFAULT false,
  "settledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revenue_records_tenant ON revenue_records("tenantId","settledAt");

-- RECEIPTS
DO $$ BEGIN CREATE TYPE receipt_status AS ENUM('draft','issued','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "receiptNumber" VARCHAR NOT NULL UNIQUE,
  "tenantId" UUID NOT NULL,
  "lenderId" UUID NOT NULL,
  "paymentId" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "cargoOwnerId" UUID NOT NULL,
  "cargoOwnerName" VARCHAR NOT NULL DEFAULT '',
  "cargoOwnerEmail" VARCHAR, "cargoOwnerPhone" VARCHAR,
  "cargoName" VARCHAR NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status receipt_status NOT NULL DEFAULT 'issued',
  "paymentMethod" VARCHAR, "transactionId" VARCHAR, "referenceNumber" VARCHAR,
  "paymentDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT, metadata JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts("tenantId");

-- USER_RATINGS
DO $$ BEGIN CREATE TYPE rating_type AS ENUM('transporter','financing_community','platform'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rating_category AS ENUM('reliability','payment_punctuality','communication','cargo_condition','professionalism','overall'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ratedUserId" UUID NOT NULL,
  "raterUserId" UUID NOT NULL,
  "ratingType" rating_type NOT NULL,
  category rating_category NOT NULL,
  rating DECIMAL(3,2) NOT NULL,
  comment TEXT, metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER_REWARDS
DO $$ BEGIN CREATE TYPE reward_type AS ENUM('transaction_bonus','volume_bonus','loyalty_points','cashback','discount','premium_features'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE reward_status AS ENUM('pending','active','redeemed','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  type reward_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  description TEXT NOT NULL DEFAULT '',
  status reward_status NOT NULL DEFAULT 'pending',
  "validFrom" DATE, "validUntil" DATE,
  criteria JSONB, metadata JSONB,
  "redeemedAt" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER_SCORES
DO $$ BEGIN CREATE TYPE score_category AS ENUM('financial_health','transaction_history','payment_behavior','cargo_quality','communication_score','reliability_score','overall_credit_score'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE score_algorithm AS ENUM('financial_analysis','behavioral_pattern','risk_assessment','comprehensive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tenantId" UUID,
  category score_category NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  "normalizedScore" DECIMAL(5,2) NOT NULL,
  algorithm score_algorithm NOT NULL,
  factors JSONB NOT NULL,
  metadata JSONB,
  explanation TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LOAN_DISBURSEMENTS
DO $$ BEGIN CREATE TYPE disbursement_status AS ENUM('initiated','success','failed','pending','approved','disbursed','rejected','on_hold'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS loan_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_request_id UUID NOT NULL,
  disbursement_date TIMESTAMPTZ,
  beneficiaries JSON NOT NULL DEFAULT '[]',
  status disbursement_status NOT NULL DEFAULT 'initiated',
  external_txn_ref VARCHAR(255), attempts INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT, next_retry_at TIMESTAMPTZ,
  amount DECIMAL(15,2), priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  documents JSONB, risk_score DECIMAL(3,1), credit_score INTEGER,
  collateral_value DECIMAL(15,2),
  disbursement_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  notes TEXT, purpose VARCHAR(500),
  interest_rate DECIMAL(5,2), term_months INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_disbursements_request ON loan_disbursements(loan_request_id, status);

-- LOAN_REPAYMENTS
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_request_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  interest_paid DECIMAL(15,2) NOT NULL,
  principal_paid DECIMAL(15,2) NOT NULL,
  repayment_date TIMESTAMPTZ NOT NULL,
  external_txn_ref VARCHAR(255) UNIQUE,
  metadata JSON,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_request ON loan_repayments(loan_request_id, repayment_date);

-- LOAN_TERMS
CREATE TABLE IF NOT EXISTS loan_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_request_id UUID NOT NULL UNIQUE,
  lender_id UUID NOT NULL,
  nominal_rate DECIMAL(7,4),
  effective_annual_rate DECIMAL(7,4),
  risk_score DECIMAL(6,2),
  risk_level VARCHAR(20),
  credit_score_input INTEGER,
  interest_rate_policy_id UUID,
  interest_rate_policy_snapshot JSONB,
  risk_score_breakdown JSONB,
  base_rate DECIMAL(7,4), rate_adjustment DECIMAL(7,4),
  origination_fee_rate DECIMAL(7,4),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  engine_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CARRIER_TIERS
DO $$ BEGIN CREATE TYPE carrier_tier_level AS ENUM('BRONZE','SILVER','GOLD','PLATINUM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS carrier_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "truckOwnerId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  tier carrier_tier_level NOT NULL DEFAULT 'BRONZE',
  "previousTier" carrier_tier_level,
  "onTimeRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "damageRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "totalTrips" INTEGER NOT NULL DEFAULT 0,
  "averageRating" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "calculatedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_carrier_tiers_owner_tenant ON carrier_tiers("truckOwnerId","tenantId");

-- SHIPMENT_RESERVATIONS
DO $$ BEGIN CREATE TYPE reservation_status AS ENUM('ACTIVE','RELEASED','REPLACED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS shipment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "cargoId" UUID NOT NULL,
  "truckId" UUID NOT NULL,
  "driverId" UUID,
  "pickupDateTime" TIMESTAMPTZ NOT NULL,
  "deliveryDateTime" TIMESTAMPTZ NOT NULL,
  status reservation_status NOT NULL DEFAULT 'ACTIVE',
  "statusReason" VARCHAR,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_reservations_truck  ON shipment_reservations("truckId", status, "pickupDateTime", "deliveryDateTime");
CREATE INDEX IF NOT EXISTS idx_shipment_reservations_driver ON shipment_reservations("driverId", status, "pickupDateTime", "deliveryDateTime");
CREATE INDEX IF NOT EXISTS idx_shipment_reservations_tenant ON shipment_reservations("tenantId", status);

-- WEBHOOK_CONFIGS
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "createdBy" UUID NOT NULL,
  name VARCHAR NOT NULL DEFAULT '',
  url VARCHAR NOT NULL DEFAULT '',
  events TEXT NOT NULL DEFAULT '',
  secret VARCHAR(64),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastDeliveredAt" TIMESTAMPTZ,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "deliveryLogs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant ON webhook_configs("tenantId","isActive");

-- GEOFENCE_ZONES
DO $$ BEGIN CREATE TYPE geofence_zone_type AS ENUM('DELIVERY_ZONE','RESTRICTED','CUSTOMER_SITE','DEPOT','CHECKPOINT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS geofence_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  name VARCHAR NOT NULL DEFAULT '',
  type geofence_zone_type NOT NULL DEFAULT 'DELIVERY_ZONE',
  polygon JSONB NOT NULL DEFAULT '[]',
  "centerLat" DECIMAL(10,7), "centerLng" DECIMAL(10,7), "radiusMeters" DECIMAL(10,2),
  "alertOnEnter" BOOLEAN NOT NULL DEFAULT true,
  "alertOnExit" BOOLEAN NOT NULL DEFAULT true,
  "linkedLoadId" UUID, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geofence_zones_tenant ON geofence_zones("tenantId","isActive");

-- LOAD_DOCUMENTS
CREATE TABLE IF NOT EXISTS load_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL, "loadId" UUID NOT NULL, "tripId" UUID,
  "brokerId" UUID, "uploadedById" UUID NOT NULL,
  "documentType" VARCHAR(100) NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  "fileName" VARCHAR NOT NULL DEFAULT '', "fileUrl" VARCHAR NOT NULL DEFAULT '',
  "fileType" VARCHAR, "fileSize" INTEGER, "mimeType" VARCHAR,
  "documentContent" TEXT, "documentData" JSONB, signatures JSONB,
  "signedAt" DATE, "verifiedById" UUID, "verifiedAt" DATE,
  "verificationNotes" TEXT, "expiresAt" DATE, description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_load_documents_load   ON load_documents("loadId","documentType");
CREATE INDEX IF NOT EXISTS idx_load_documents_tenant ON load_documents("tenantId","createdAt");

-- LOAD_MATCHES
DO $$ BEGIN CREATE TYPE match_status AS ENUM('POTENTIAL','REQUESTED','ACCEPTED','REJECTED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS load_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, load_id UUID, truck_id UUID,
  score NUMERIC(5,2), status match_status NOT NULL DEFAULT 'POTENTIAL',
  match_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_load_matches_truck ON load_matches(truck_id, status);
CREATE INDEX IF NOT EXISTS idx_load_matches_load  ON load_matches(load_id, status);

-- LOAD_TEMPLATES
CREATE TABLE IF NOT EXISTS load_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL, name VARCHAR NOT NULL DEFAULT '',
  description TEXT, "templateData" JSONB NOT NULL DEFAULT '{}',
  "createdBy" UUID NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- PRICE_SUGGESTIONS
CREATE TABLE IF NOT EXISTS price_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loadId" UUID NOT NULL,
  "pricingModel" VARCHAR(50) NOT NULL DEFAULT 'market_rate',
  "suggestedAmount" DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  "confidenceLevel" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  "minAmount" DECIMAL(15,2), "maxAmount" DECIMAL(15,2),
  metadata JSONB, "isAutomated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_price_suggestions_load ON price_suggestions("loadId", status);

-- PRIVATE_CARRIER_NETWORKS
CREATE TABLE IF NOT EXISTS private_carrier_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cargoOwnerId" UUID NOT NULL, "truckOwnerId" UUID NOT NULL,
  "tenantId" UUID NOT NULL, notes TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "addedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pcn_unique ON private_carrier_networks("cargoOwnerId","truckOwnerId","tenantId");

-- RATE_LIMITS
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" VARCHAR(255) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  "userId" VARCHAR(50), "ipAddress" VARCHAR(50), "userAgent" VARCHAR(100),
  "requestCount" INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  metadata TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ, "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  "blockedUntil" TIMESTAMPTZ, reason VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant ON rate_limits("tenantId", endpoint, "createdAt");
